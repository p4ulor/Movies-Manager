function submit(){ //no longer in use, it was just an experiment
    const body = () => {
        const name = document.getElementsByName("name")[0].value
        const pw = document.getElementsByName("password")[0].value
        console.log("name=", name, "pw=", pw)
        return {
            name: name,
            password: pw
        }
    }

    fetx("/api/login", "POST", body()).then(obj=>{
        if(obj) {
            document.cookie = `token=${obj.token}`
            window.location = "/"
        }
    })
}

wassupWorld()
