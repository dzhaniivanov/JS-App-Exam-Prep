const userModel = firebase.auth();
const database = firebase.firestore();

const app = Sammy('#root', function () {
    this.use('Handlebars', 'hbs');



    this.get('/home', function (context) {
        database.collection('offers')
            .get()
            .then((response) => {
                context.offers = response.docs.map((offer) => { return { id: offer.id, ...offer.data() } })
                extendContext(context)
                    .then(function () {
                        this.partial('./templates/home.hbs');
                    })
            })
            .catch(errorHandler)

    });

    this.get('/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/register.hbs')
            })

    });

    this.get('/login', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/login.hbs')

            })
    });
    this.post('/register', function (context) {
        const { email, password, rePassword } = context.params;

        if (password !== rePassword) {
            alert('passwords dont match')
            return;
        }

        userModel.createUserWithEmailAndPassword(email, password)
            .then((data) => {
                console.log(data);
                this.redirect('#/home')

            })
            .catch(errorHandler);
    })

    this.get('/create', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/create.hbs')

            })
    });
    this.post('/login', function (context) {
        const { email, password } = context.params;

        userModel.signInWithEmailAndPassword(email, password)
            .then((data) => {
                saveUserData(data);
                this.redirect('#/home')

            })
            .catch(errorHandler)

    })

    this.get('/details/:offerId', function (context) {
        const { offerId } = context.params;
        database.collection('offers').doc(offerId).get()
            .then((response) => {
                const actualInfo = response.data();
                let isAuthor = actualInfo.author === getUserData().uid;
                context.offer = { ...actualInfo, isAuthor, id: offerId }

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/details.hbs')

                    })
            })
    });

    this.get('/edit/:offerId', function (context) {
        const { offerId } = context.params;

        database.collection('offers').doc(offerId).get()
            .then((response) => {

                context.offer = { id: offerId, ...response.data() };
                extendContext(context)
                    .then(function () {
                        this.partial('./templates/edit-page.hbs')

                    })

            })



    });
    this.post('/edit/:offerId', function (context) {
        const { offerId, model, price, imageUrl, description, brand } = context.params;

        database.collection('offers').doc(offerId).get()
            .then((response) => {
                return database.collection('offers').doc(offerId).set({
                    ...response.data(),
                    model,
                    price,
                    imageUrl,
                    description,
                    brand
                })

            })
            .then((response) => {
                this.redirect(`#/details/${offerId}`)
            })
            .catch(errorHandler)






    })


    this.get('/logout', function (context) {

        userModel.signOut()
            .then((response) => {
                clearUserData();
                this.redirect('#/home')
            })
            .catch(errorHandler)
    })

    this.post('/create', function (context) {
        const { model, price, imageUrl, description, brand } = context.params;
        database.collection('offers').add({
            model,
            price,
            imageUrl,
            description,
            brand,
            author: getUserData().uid,
            

        })
            .then((newProduct) => {

                this.redirect('#/home');
            })
            .catch(errorHandler);
    })
    this.get('/delete/:offerId', function (context) {
        const { offerId } = context.params;
        database.collection('offers').doc(offerId).delete()
            .then(() => {
                this.redirect('#/home');
            })
            .catch(errorHandler);

    })

    this.get('/buy/:offerId', function (context) {
        const {offerId}=context.params;
        const {uid}=getUserData();

        database.collection('offers')
            .doc(offerId)
            .get()
            .then((response) => {
                let offerData = { ...response.data() }
                offerData.clients.push(uid  )
                return database.collection('offers')
                    .doc(offerId)
                    .set(offerData)
            })
            .then(()=>{
                this.redirect(`#/details/${offerId}`)
            })
            .catch(errorHandler);

    })
});

(() => {
    app.run('/home');
})();


function extendContext(context) {
    const user = getUserData();
    context.isLoggedIn = Boolean(user);
    context.userEmail = user ? user.email : '';

    return context.loadPartials({
        'header': './templates/header.hbs',
        'footer': './templates/footer.hbs'
    });
}

function errorHandler(error) {
    console.log(error);
    alert(error.message);
}

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }))

}

function getUserData() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function clearUserData() {
    this.localStorage.removeItem('user');

}
