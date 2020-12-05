const userModel = firebase.auth();
const database = firebase.firestore();
const app = Sammy('#root', function () {
    this.use('Handlebars', 'hbs');

    this.get('/home', function (context) {

        database.collection('movies')
            .get()
            .then((response) => {
                context.movies = response.docs.map((movie) => { return { id: movie.id, ...movie.data() } });
                extendContext(context)
                    .then(function () {
                        this.partial('/templates/home.hbs');

                    })
            })
            .catch(errorHandler)

    });
    this.get('/addMovie', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/addMovie.hbs')
            })
    })
    this.get('/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/register.hbs')
            })
    })
    this.get('/login', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/login.hbs');
            })
    });
    this.get('/logout', function (context) {
        userModel.signOut()
            .then((response) => {
                clearUserData();
                toastr.success('You are now logged out!')
                this.redirect('/home');

            })
            .catch(errorHandler);

    })
    this.get('/create', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('/templates/addMovie.hbs')
            })
    });
    this.get('/details/:id', function (context) {

        const { id } = context.params;
        database.collection('movies')
            .doc(id)
            .get()
            .then((response) => {
                const { uid } = getUserData();
                const info = response.data();
                const isAuthor = info.author === uid;

                const likeIndex = info.likes.indexOf(uid);
                const isLiked = likeIndex > -1;
                context.movie = { ...info, isAuthor, id, isLiked };
                extendContext(context)
                    .then(function () {
                        this.partial('/templates/details.hbs')
                    })

            })

    });
    this.get('/edit/:id', function (context) {
        const { id } = context.params;

        database.collection('movies')
            .doc(id)
            .get()
            .then((response) => {
                context.movie = { id, ...response.data() };
                extendContext(context)
                    .then(function () {
                        this.partial('/templates/edit.hbs')
                    })
            })

    });
    this.get('/delete/:id', function (context) {
        const { id } = context.params;

        database.collection('movies')
            .doc(id)
            .delete()
            .then(() => {
                this.redirect('/home');
            })
            .catch(errorHandler)
    });
    this.get('/search', function () {
        let { searchWord } = this.params;

        database.collection('movies')
            .get()
            .then(response => {
                this.movies = response.docs
                    .map(movie => { return { ...movie.data(), id: movie.id } })
                    .filter(movie => movie.title.toLowerCase().includes(searchWord.toLowerCase()));
                extendContext(this)
                    .then(function () {
                        this.partial('/templates/home.hbs')
                    })
            })
    })


    this.post('/register', function (context) {
        const { email, password, rePass } = context.params;
        if (password !== rePass) {
            toastr.warning('Password\'s must match!');
            return;
        }
        userModel.createUserWithEmailAndPassword(email, password)
            .then((user) => {
                this.redirect('/login')
            })
            .catch(errorHandler);
    });
    this.post('/login', function (context) {
        const { email, password } = context.params;
        userModel.signInWithEmailAndPassword(email, password)
            .then((user) => {
                saveUserData(user);
                toastr.success('Successfuly logged in!')
                this.redirect('/home')
            })
            .catch(errorHandler);

    });
    this.post('/addMovie', function (context) {
        const { title, description, imageUrl } = context.params;

        database.collection('movies')
            .add({
                title,
                description,
                imageUrl,
                author: getUserData().uid,
                likes: [],
            })
            .then((newMovie) => {
                toastr.success('You successfuly added a new movie to the collection!')
                this.redirect('/home');
            })
            .catch(errorHandler);

    });
    this.post('/edit/:id', function (context) {
        const { id, title, description, imageUrl } = context.params;

        database.collection('movies')
            .doc(id)
            .get()
            .then((response) => {
                return database.collection('movies')
                    .doc(id)
                    .set({
                        ...response.data(),
                        title,
                        description,
                        imageUrl,
                    })
                    .then((response) => {
                        toastr.success('You successfully edited a movie record!')
                        this.redirect(`/details/${id}`)
                    })

            })
            .catch(errorHandler)
    });
    this.get('/like/:id', function (context) {
        const { id } = context.params;
        const { uid } = getUserData();
        database.collection('movies')
            .doc(id)
            .get()
            .then((response) => {
                let movieData = { ...response.data() };
                movieData.likes.push(uid)
                return database.collection('movies')
                    .doc(id)
                    .set(movieData)
            })
            .then(() => {
                toastr.success('You successfully like the movie!')
                this.redirect(`/details/${id}`)
            })
            .catch(errorHandler);
    });

});
app.run('/home');

function extendContext(context) {
    const user = getUserData();
    context.isLogged = Boolean(user);
    context.email = user ? user.email : '';
    return context.loadPartials({
        'nav': './templates/nav.hbs',
        'footer': './templates/footer.hbs'
    });

}

function errorHandler(error) {
    toastr.warning(error.message);
}

function saveUserData(data) {
    const { user: { email, uid } } = data
    localStorage.setItem('user', JSON.stringify({ email, uid }));
}

function getUserData() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function clearUserData() {
    this.localStorage.removeItem('user');
}
