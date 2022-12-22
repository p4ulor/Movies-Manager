import express from 'express'

const router = express.Router() //https://expressjs.com/en/5x/api.html#router

class HandleBarsView {
    /**
     * @param {String} file 
     * @param {Object} options
     */
    constructor(file, title, body, css) {
        this.file = file
        this.options = {
            title, 
        }
    }
}

router.get('/',(req, rsp) => {
    homePage(null, rsp)
    .then(view => {
        return rsp.render(view.file, view.options)
    })
    .catch(e => {

    })
})

router.get('/login',(req, rsp) => {
    loginPage(null, rsp)
    .then(view => {
        return rsp.render(view.file, view.options)
    })
    .catch(e => {

    })
})

export default router

async function homePage(req, rsp) {
    const view = new HandleBarsView('home.hbs', 'Home')
    return view
}

async function loginPage(req, rsp) {
    const view = new HandleBarsView('login.hbs', 'Login')
    return view
}

