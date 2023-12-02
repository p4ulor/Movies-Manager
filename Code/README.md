### Make sure the terminal is in the correct location
- cd ./code

### In order to use, first install the dependencies in package.json (the resulting node_modules folder will be 40mb)
- npm install

### Plain run:
- node cmdb-server.mjs
or
- npm run start

### Dev run (auto re-runs on code changes, requires [nodemon](#nodemon) package)
- npm run dev

### Run mocha tests
- npm run test

## NPM packages/dependencies included:
### For creating and managing the server
- [express](https://www.npmjs.com/package/express) - For Handling HTTP requests
- [node-fetch](https://www.npmjs.com/package/node-fetch) - For Making server side HTTP requests
- [cookie-parser](https://www.npmjs.com/package/cookie-parser)
- [express-session](https://www.npmjs.com/package/express-session)
- [cors](https://www.npmjs.com/package/cors)
- [passport](https://www.npmjs.com/package/passport) (didn't up using it because I didn't understand how to make it work)

### For creating the front-end UI (the view engine)
- [hbs](https://www.npmjs.com/package/hbs)
- [serve-favicon](https://www.npmjs.com/package/serve-favicon)

### For integrated tests
- [mocha](https://www.npmjs.com/package/mocha) - A framework to run tests (which allows the use of other assertion libraries)
- [chai](https://www.npmjs.com/package/chai) - The assertion library to use
- [deep-equal-in-any-order](https://www.npmjs.com/package/deep-equal-in-any-order) - A plugin for chai that makes testing complex objects easier
- [chai-http](https://www.npmjs.com/package/chai-http) - Used for doing HTTP requests in the tests
- [supertest](https://www.npmjs.com/package/supertest) - Another assertion library for tests as requested in Part 3 of the assignment

### For the documentation page
- [yamljs](https://www.npmjs.com/package/yamljs)
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)

### For HTTP logging
- [morgan (not in use)](https://www.npmjs.com/package/morgan). [what is morgan?](https://www.geeksforgeeks.org/what-is-morgan-in-node-js/)

### Nodemon:
- [nodemon](https://www.npmjs.com/package/nodemon/v/1.18.10) - 
You can optionally install it globally since it's not a component that is part of our code and it's a useful package to use globally. (installing other types of packages globally isn't very recommended since it can be tricky IMO). To install globally, run `npm install nodemon -g`. Run .js files like: nodemon <file.mjs>. This will make so we don't have to restart the server everytime we make changes to our code, which can make developing faster and easier. Then you will be able to run `npm run dev`

## About elastic search
It's a NoSQL and document structured database. which was built using Java and runs w/ the JVM. It stores our data in JSON format, which is an advantage because we're using JS, so the there's interoperability between the database and our server. It can be accessed by an HTTP API and follows the REST principles. Elastic Search 8.5.3 is 600mb, once it is ran. An Elastic Search cluster is created once you run it, it's a group of one or more Elasticsearch nodes instances that are connected together, which store our data. Elastic Search is by default running in port 9200
### See here on how to config and use it
[See elastic-search-config.md](../docs/elastic-search-config.md)

## Useful paths to consult data in the DB
- http://localhost:9200/_cat
- http://localhost:9200/_all
- http://localhost:9200/_cat/indices
- http://localhost:9200/users/_doc/{_id}
- http://localhost:9200/movies/_search