const userModel = firebase.auth();
const database = firebase.firestore();

const app = Sammy('#root', function () {
    this.use('Handlebars', 'hbs');

    this.get('/home', function (context) {
        database.collection('campaigns')
            .get()
            .then((response) => {
                context.campaigns = response.docs.map((campaign) => { return { id: campaign.id, ...campaign.data() } })

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/homeTemplate.hbs')
                    })
            })
            .catch(errorHandler);
    })

    this.get('/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/register.hbs')
            })
    })
    this.get('/login', function (context) {

        extendContext(context)
            .then(function () {
                this.partial('./templates/login.hbs')
            })
    })
    this.get('/request', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/request.hbs')
            })
    })
    this.get('/edit/:campaignId', function (context) {
        const { campaignId } = context.params;

        database.collection('campaigns')
            .doc(campaignId)
            .get()
            .then((response) => {
                context.campaign = { id: campaignId, ...response.data() };
                extendContext(context)
                    .then(function () {
                        this.partial('/templates/edit.hbs')
                    })
            })


    })
    this.get('/logout', function (context) {

        //logout();
        //this.redirect('/home')
        userModel.signOut()
            .then(() => {
                clearUserData();
                this.redirect('/home');
            })
    })
    this.get('/details/:campaignId', function (context) {

        const { campaignId } = context.params;
        database.collection('campaigns')
            .doc(campaignId)
            .get()
            .then((response) => {
                const info = response.data();
                const isAuthor = info.author === getUserData().uid;
                context.campaign = { ...info, isAuthor, id: campaignId };

                extendContext(context)
                    .then(function () {
                        this.partial('/templates/details.hbs')
                    })

            })

    });
    this.get('/delete/:campaignId', function (context) {
        const { campaignId } = context.params;

        database.collection('campaigns')
            .doc(campaignId)
            .delete()
            .then(() => {
                this.redirect('/home')

            })
            .catch(errorHandler);
    })

    this.post('/register', function (context) {
        const { email, password, rePassword } = context.params;
        if (password !== rePassword) {
            return;
        }
        userModel.createUserWithEmailAndPassword(email, password)
            .then((user) => {
                this.redirect('/login')

            })
            .catch(errorHandler)



    })
    this.post('/login', function (context) {

        const { email, password } = context.params;
        userModel.signInWithEmailAndPassword(email, password)
            .then((user) => {
                saveUserData(user);
                this.redirect('/home')
            })
            .catch(errorHandler)
    })
    this.post('/request', function (context) {

        const { location, dateTime, description, imageUrl } = context.params;
        database.collection('campaigns').add({
            location,
            dateTime,
            description,
            imageUrl,
            author: getUserData().uid,
            likes: [],
            email: getUserData().email,
            currentRequests: [],
        })
            .then((newCampaign) => {
                this.redirect('/home');
            })
            .catch(errorHandler);
    })
    this.post('/edit/:campaignId', function (context) {
        const { campaignId, location, dateTime, description, imageUrl } = context.params;

        database.collection('campaigns')
            .doc(campaignId)
            .get()
            .then((response) => {
                return database.collection('campaigns')
                    .doc(campaignId)
                    .set({
                        ...response.data(),
                        location,
                        dateTime,
                        description,
                        imageUrl,
                    })

            })
            .then((response) => {
                this.redirect(`/details/${campaignId}`)
            })
            .catch(errorHandler)
    });
    this.get('/like/:campaignId', function (context) {
        const { campaignId } = context.params;
        const { uid } = getUserData();

        database.collection('campaigns')
            .doc(campaignId)
            .get()
            .then((response) => {
                const campaignInfo = { ...response.data() }
                campaignInfo.likes.push(uid);
                console.log(campaignInfo);
                
                return database.collection('campaigns')
                    .doc(campaignId)
                    .set(campaignInfo)
            })
            .then(() => {
                this.redirect(`/details/${campaignId}`)
            })
            .catch(errorHandler)

    });
    this.get('/profile', function (context) {
        const { campaignId } = context.params;
        const { email, uid } = getUserData();

        database.collection('campaigns')
            .doc(campaignId)
            .get()
            .then((response) => {
            })

        extendContext(context)
            .then(function () {
                this.partial('./templates/profile.hbs')
            })
    })

});
app.run('/home')

function extendContext(context) {
    const user = getUserData();
    context.isLoggedIn = Boolean(user);
    context.email = user ? user.email : '';
    return context.loadPartials({
        'navigation': './templates/navigation.hbs',
        'footer': './templates/footer.hbs'
    });
};

function errorHandler(error) {
    console.error(error);
}

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }))

}

function getUserData() {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;
}

// function logout(){
//     localStorage.setItem('user','');
// } 

function clearUserData() {
    this.localStorage.removeItem('user');
}