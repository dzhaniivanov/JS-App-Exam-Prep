const userModel = firebase.auth();
const database = firebase.firestore();
const app = Sammy('#root', function () {
    this.use('Handlebars', 'hbs')

    this.get('/home', function (context) {
        database.collection('posts')
            .get()
            .then((response) => {
                context.posts = response.docs.map((post) => { return { id: post.id, ...post.data() } })
                extendContext(context)
                    .then(function () {
                        this.partial('/templates/home.hbs')
                    })
            })
            .catch(err => console.error(err));

    });
    this.get('/login', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/login.hbs')
            })
    });
    this.get('/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/register.hbs')
            })
    });
    this.get('/logout', function (context) {
        userModel.signOut()
            .then((response) => {
                clearUserData();
                this.redirect('/home');
            })
            .catch(err => console.error(err));

    });
    this.get('/post', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/post.hbs')
            })
    });
    this.get('/details/:id', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/details.hbs')
            })
    });
    this.get('/edit/:id', function (context) {
        const { id } = context.params;

        database.collection('posts')
            .doc(id)
            .get()
            .then((response) => {
                context.post = { id, ...response.data() };
                extendContext(context)
                    .then(function () {
                        this.partial('/templates/edit.hbs')
                    })
            })

    });
    this.get('/delete/:id',function(context){
        const {id}=context.params;

        database.collection('posts')
        .doc(id)
        .delete()
        .then(()=>{
            this.redirect('/home')
        })
        .catch(err=>console.error(err));
    })
    this.post('/register', function (context) {
        const { email, password, repeatPassword } = context.params;
        if (password !== repeatPassword) {
            return;
        }

        userModel.createUserWithEmailAndPassword(email, password)
            .then((newUser) => {
                this.redirect('/login')

            })
            .catch(err => console.error(err))

    });
    this.post('/login', function (context) {
        const { email, password } = context.params;

        userModel.signInWithEmailAndPassword(email, password)
            .then((user) => {
                saveUserData(user);
                this.redirect('/home')

            })
            .catch(err => console.error(err));

    });
    this.post('/post', function (context) {
        const { title, category, content } = context.params;
        database.collection('posts')
            .add({
                title,
                category,
                content,
                author: getUserData().uid,
            })
            .then((newPost) => {
                this.redirect('/home');
            })
            .catch(err => console.error(err));
    });
    this.post('/edit/:id', function (context) {
        const { id, title, category, content } = context.params;

        database.collection('posts')
            .doc(id)
            .get()
            .then((response) => {
                return database.collection('posts')
                    .doc(id)
                    .set({
                        ...response.data(),
                        title,
                        category,
                        content,
                    })
                    .then((response) => {
                        this.redirect('/home')
                    })
            })
            .catch(err => console.error(err));

    });


})
app.run('/home');

function extendContext(context) {
    const user = getUserData();
    context.isLogged = Boolean(user);
    context.email = user ? user.email : '';
    return context.loadPartials({
        'header': '/templates/header.hbs'
    })
}

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }));
}
function getUserData() {
    const user = localStorage.getItem('user');
    return JSON.parse(user);
}
function clearUserData() {
    localStorage.removeItem('user');
}