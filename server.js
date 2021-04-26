/* eslint-disable quotes */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'user strict';

// application dependencies
require('dotenv').config();

const express = require('express');
const pg = require ('pg');
const cors = require('cors');
const superagent = require ('superagent');
const methodOverride = require('method-override');
const { put } = require('superagent');

const PORT = process.env.PORT || 3000;


// Database
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

// app
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

// routes
app.get('/',homeHandler);
app.post('/SearchBook',searchHandler);
app.post('/addBook',addBookHandler);
app.get('/details/:bookID',detailsHandler);
app.put('/updateBook/:bookID',updateHandler);
app.delete('/deleteBook/:bookID',deleteHandler);
// app.get('*',errorHandler);

//Handlers

function homeHandler(req,res){
  let SQL = `SELECT * FROM books;`;
  client.query(SQL)
    .then (result => {
      res.render('pages/index',{savedBooks:result.rows});
    })
    .catch( error => {
      res.send(error);
    });
}

function searchHandler (req,res){
  let bookArr = [];
  let bookName = req.body.book;
  let bookChoice = req.body.bookSearch;
  console.log(`book? ${bookName}`);
  console.log(`choice? ${bookChoice}`);
  let bookURL = `https://www.googleapis.com/books/v1/volumes?q=+${bookChoice}:${bookName}`;

  superagent.get(bookURL)
    .then(bookData =>{
      let data = bookData.body.items;
      data.forEach(Bdata => {
        let newBook = new Book (Bdata);
        bookArr.push(newBook);
      });
      res.render('pages/search',{bookArray:bookArr});
    });

}

function addBookHandler (req,res){
  let {title,author,isbn,date,image_url,description} = req.body;
  let bookCheck = [isbn];
  let SQL = `SELECT * FROM books WHERE isbn=$1;`;
  client.query(SQL,bookCheck)
    .then(result =>{
      if(result.rowCount){
        res.send('book already in the list');
      }
      else {
        SQL = `INSERT INTO books (title,author,isbn,date,image_url,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`;
        let safeValues =[title,author,isbn,date,image_url,description];
        client.query(SQL,safeValues)
          .then(result =>{
            res.redirect('/');
          });
      }
    });
}

function detailsHandler(req,res){
  let SQL =`SELECT * FROM books WHERE id=$1;`;
  let value = [req.params.bookID];
  client.query(SQL,value)
    .then(result => {
      res.render('pages/details',{book:result.rows[0]});
    });
}
function updateHandler (req,res){
  console.log('Book ID',req.params.bookID);
  let idValue = req.params.bookID;
  let {title,author,isbn,date,image_url,description} = req.body;
  let SQL = `UPDATE books SET title=$1,author=$2,isbn=$3,date=$4,image_url=$5,description=$6 WHERE id=$7;`;
  let safeValues = [title,author,isbn,date,image_url,description,idValue];
  client.query(SQL,safeValues)
    .then(result => {
      res.redirect(`/details/${idValue}`);
    }).catch(error => {
      res.send(error);
    });
  // res.redirect('/');

}

function deleteHandler (req,res){
  let SQL =`DELETE FROM books where id=$1;`;
  let id = [req.params.bookID];
  client.query(SQL,id)
    .then(result =>{
      res.redirect('/');
    });
}

function errorHandler(req,res){
  res.render('pages/error');
}


//constructors

function Book (bookData){
  this.title = (bookData.volumeInfo.title) ? bookData.volumeInfo.title : 'Not available';
  this.author = (bookData.volumeInfo.authors) ? bookData.volumeInfo.authors : 'Not available';
  this.isbn = (bookData.volumeInfo.industryIdentifiers[0].identifier) ? bookData.volumeInfo.industryIdentifiers[0].identifier: 'Not available';
  this.date = (bookData.volumeInfo.publishedDate) ? bookData.volumeInfo.publishedDate : 'Not available';
  this.image_url = (bookData.volumeInfo.imageLinks) ? bookData.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.description = (bookData.volumeInfo.description) ? bookData.volumeInfo.description : 'Not available';
}

// Port listner
client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });

