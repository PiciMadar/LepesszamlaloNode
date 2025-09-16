const express= require('express');
const fs = require('fs');
const path = require('path');
const { json } = require('stream/consumers');
var cors = require('cors');
const { send } = require('process');

const app = express()

// Middleware-ek V
app.use(cors())
app.use(express.json()) // json megkövetelése
app.use(express.urlencoded({extended: true})) //req body-n átküldjük az adatokat

let users=[];
let steps = []

const USER_FILE = path.join(__dirname, 'users.json')
const STEPS_FILE = path.join(__dirname, 'steps.json')

//ENDPOINTS
loadUsers();
loadSteps();



app.get('/', (req, res) => {
  res.send(' Backend API by Bajai SZC Türr IStván Technikum - 13.A Szerverfejlesztő')
});

//get all users
app.get('/users', (req,res)=>{
    res.send(users);
})

app.get('/users/:id',(req,res)=>{
    let id=req.params.id;
    let idx=users.findIndex(user=>user.id==id);
    
    if(idx>-1)
        {
           return res.send(users[idx].name+", "+users[idx].age);
        }
        return res.status(400).send( {msg: 'Nincs ilyen felhasznalo'});
})

//Post new user

app.post('/users', (req, res) => {
    let data = req.body;

    if(DoesEmailExists(data.email)){
        return res.status(400).send({msg:'Ez az email cím már regisztrálva van'})
    }

    data.id  = getNextID()
    users.push(data)
    saveUsers();
    res.status(200).send({msg:"A felhasználó regisztrálva"});  
})

//POST logged user
app.post('/users/login',(req,res) => {
    let {email,password} = req.body;
    let loggeduser = {}
    users.forEach(user =>{
        if(user.email == email && user.password == password){
            loggeduser = user;
            return
        }
    })
    res.send(loggeduser)    ;
})

//update user profile
app.patch('/users/profile/:id', (req,res) =>{
    let {id,name,email} = req.body;

    id = Number(id)

    let idx = users.findIndex(user => {user.email == email && user.id != id})
    if(idx > -1){
        return res.status(400).send({ msg : 'Ez az e-mail cím már foglalt!' })
    }

    idx = users.findIndex(user => user.id == id)

    if(idx == -1){
        return res.status(400).send({msg:"Nem található felhasználó"})
    }

    users[idx].name = name;
    users[idx].email = email;
    saveUsers();

    return res.send({msg: 'A profil módosítva!'})
})

//update user password
app.patch('/users/passmod/:id', (req,res) =>{
    let(id,oldpass,newpass) = req.body

    id = Number(id)
    let idx = users.findIndex(user => user.id == id);
    if(idx == -1){
        return res.status(400).send({msg:"Nem található felhasználó"})
    }
    if(users[idx].password != oldpass){
        return res.status(400).send({msg:"Nem megfelelő jelszó"})
    }

    users[idx].password = newpass;
    saveUsers();

    return res.send({msg: "A jelszó sikeresen módosítva!"})
})

//update user by id
app.patch('/users/:id', (req,res) => {
    let id = req.params.id;
    let data = req.body;
    let idx = users.findIndex(user => user.id == id);
    if(idx >-1){
        users[idx] = data
        users[idx].id = Number(id)
        saveUsers()
        return res.send("Modosítva")
    }
    return res.status(400).send({msg:"Nem lett semmi se módosítva"})
})



app.delete('/users/:id', (req,res) => {
    let id = req.params.id;
    let idx = users.findIndex(user => user.id == id)
    if (idx > -1){
        users.splice(idx, 1);
        saveUsers();
        return res.send({msg:"A felhasználó törölve lett"})
    }
    return res.status(400).send({msg:"Nincs ilyen felhasználó"})
});


//get user by id
app.get('/users/:id', (req,res) => {
    let id = req.params.id;
    let idx = users.findIndex(user => user.id == id)
    if (idx > -1){
        return res.send(users[idx])
    }
    return res.status(400).send({msg:"Nincs ilyen felhasználó"})
});

//-------------STEPS---------------


//Get all steps by userid
app.get('/steps', (req,res) =>{
    res.send(steps)
})

//Get one step by userid
app.get('/steps/:id', (req,res) =>{
    let id = req.params.id;
    let idx = steps.findIndex(step => step.id == id)
    if(idx > -1){
        return res.send(steps[idx])
    }
    return res.status(400).send({msg:"Nincs ilyen ID-jű lépés"})
})

//Post new step
app.post('/steps', (req,res) =>{
    let data = req.body;
    data.id = getNextStepID()
    data.uid = 1
    steps.push(data)
    saveSteps();
    res.status(200).send({msg:"A lépésszám felvéve"});  
})

//Patch step by userid
app.patch('/steps/:id', (req, res)=>{
    let id = req.params.id;
    let data = req.body;

    let idx = steps.findIndex(step => step.id == id);

    if (idx > -1) {
        steps[idx] = data;
        steps[idx].id = Number(id);
        saveSteps();
        return res.send({msg: 'A lépésadat sikeresen módosítva'});
    }
    return res.status(400).send({msg:'Nincs ilyen lépésadat!'});
});

//Delete step by userid
app.delete('/steps/:id', (req, res)=>{
    let id = req.params.id;
    let idx = steps.findIndex(step => step.id == id);

    if (idx == -1){
        res.status(400).send({msg: 'Nincs ilyen lépésadat!'});
        return
    }

    steps.splice(idx, 1);
    saveSteps();
    res.send({msg: 'Lépésadat sikeresen törölve!'});
 });

//Delete all steps by userid
app.delete('/steps/user/:uid', (req, res)=>{
    let userId = req.params.uid;
    let idx = users.findIndex(user => user.id == userId);

    if (idx == -1){
        res.status(400).send({msg: 'Nincs ilyen felhasználó!'});
        return
    }
    
    steps = steps.filter( step => step.userId != userId);
    saveSteps();
    res.send({msg: 'Lépésadatok sikeresen törölve!'});
 });


 
// DELETE all steps of users
app.delete('/steps', (req, res)=>{
    steps = [];
    saveSteps();
    res.send({msg: 'Az összes lépésadat sikeresen törölve!'});
}); 
//----------------------------------

app.listen(3000)

function getNextID(){
    let nextID = 1
    if(users.length == 0){
        return nextID
    }
    let maxindex = 0
    for(let i = 0; i< users.length; i++){
        if(users[i].id > users[maxindex].id){
            maxindex = i;
        }
    }
    return users[maxindex].id + 1;
}

function getNextStepID(){
    let nextID = 1
    if(steps.length == 0){
        return nextID
    }
    let maxindex = 0
    for(let i = 0; i< steps.length; i++){
        if(steps[i].id > steps[maxindex].id){
            maxindex = i;
        }
    }
    return steps[maxindex].id + 1;
}


function loadUsers(){
    if(fs.existsSync(USER_FILE)){
        const raw = fs.readFileSync(USER_FILE)
        try{
            users = JSON.parse(raw)
        }catch(err){
            console.log("Hiba az adatok beolvasása során!\n", err)
            users = []
        }
    }   
    else{
        saveUsers();
    }
}


function loadSteps(){
    if(fs.existsSync(STEPS_FILE)){
        const raw = fs.readFileSync(STEPS_FILE)
        try{
            steps = JSON.parse(raw)
        } catch(err) {
            console.log("Hiba a lépések beolvasása során! \n", err)
            steps = []
        }
    }
    else{
        saveSteps();
    }
}
function saveSteps(){
    fs.writeFileSync(STEPS_FILE, JSON.stringify(steps))
}

function saveUsers(){
    fs.writeFileSync(USER_FILE, JSON.stringify(users));
}

function DoesEmailExists(email){
    let exists = false;
    users.forEach(user =>{
        if(user.email == email){
            exists = true
            return
        }
    })
    return exists;
}

