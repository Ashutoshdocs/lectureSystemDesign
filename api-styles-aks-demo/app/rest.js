// ---------------------------------------------------------------------------
// REST  ->  "the most widely used API style for industry web applications"
// Classic resource + HTTP verbs (GET/POST/PUT/DELETE) + status codes.
// ---------------------------------------------------------------------------
const express = require('express');
const router = express.Router();

router.use(express.json()); // JSON body parsing scoped to REST routes only

let books = [
  { id: 1, title: 'The Pragmatic Programmer', author: 'Hunt & Thomas' },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin' },
];
let nextId = 3;

// GET collection
router.get('/books', (req, res) => res.json(books));

// GET single
router.get('/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// CREATE
router.post('/books', (req, res) => {
  const { title, author } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const book = { id: nextId++, title, author: author || 'Unknown' };
  books.push(book);
  res.status(201).json(book);
});

// UPDATE
router.put('/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  const { title, author } = req.body || {};
  if (title) book.title = title;
  if (author) book.author = author;
  res.json(book);
});

// DELETE
router.delete('/books/:id', (req, res) => {
  const before = books.length;
  books = books.filter((b) => b.id !== Number(req.params.id));
  if (books.length === before) return res.status(404).json({ error: 'Book not found' });
  res.status(204).send();
});

module.exports = router;
