// ---------------------------------------------------------------------------
// GraphQL  ->  "used when clients need flexible data fetching"
// The client asks for exactly the fields it wants; one endpoint, no over-fetch.
// ---------------------------------------------------------------------------
const { createSchema } = require('graphql-yoga');

const books = [
  { id: '1', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', pages: 352, year: 1999 },
  { id: '2', title: 'Clean Code', author: 'Robert C. Martin', pages: 464, year: 2008 },
  { id: '3', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', pages: 616, year: 2017 },
];

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Book {
      id: ID!
      title: String!
      author: String!
      pages: Int
      year: Int
    }
    type Query {
      books: [Book!]!
      book(id: ID!): Book
    }
    type Mutation {
      addBook(title: String!, author: String): Book!
    }
  `,
  resolvers: {
    Query: {
      books: () => books,
      book: (_, { id }) => books.find((b) => b.id === id) || null,
    },
    Mutation: {
      addBook: (_, { title, author }) => {
        const book = { id: String(books.length + 1), title, author: author || 'Unknown', pages: null, year: null };
        books.push(book);
        return book;
      },
    },
  },
});

module.exports = schema;
