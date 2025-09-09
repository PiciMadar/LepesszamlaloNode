const express= require('express');
const fs = require('fs');
const path = require('path');
const { json } = require('stream/consumers');
var cors = require('cors')

const app = express()

// Middleware-ek V
app.use(cors())
app.use(express.json()) // json megkövetelése
app.use(express.urlencoded({extended: true})) //req body-n átküldjük az adatokat

let users=[

];

const USER_FILE = path.join(__dirname, 'users.json')

loadUsers();




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