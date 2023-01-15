## In order to use, first install the dependencies in package.json 
- npm install

## Plain run:
- node cmdb-server.mjs
or
- npm run start

## Run mocha tests
- npm run test

## NPM Packages/dependencies included:
### For creating and managing the server
- [express](https://www.npmjs.com/package/express) - For Handling HTTP requests
- [node-fetch](https://www.npmjs.com/package/node-fetch) - For Making server side HTTP requests
- [cookie-parser](https://www.npmjs.com/package/cookie-parser)
- [express-session](https://www.npmjs.com/package/express-session)
- [cors](https://www.npmjs.com/package/cors)
- [passport](https://www.npmjs.com/package/passport)
### For creating the front-end UI (the view engine)
- [hbs](https://www.npmjs.com/package/hbs)
- [serve-favicon](https://www.npmjs.com/package/serve-favicon)
## For tests
- [mocha](https://www.npmjs.com/package/mocha) and [chai](https://www.npmjs.com/package/chai) - For Unit testing
- [deep-equal-in-any-order](https://www.npmjs.com/package/deep-equal-in-any-order) - A plugin for chai that makes testing complex objects easier
- [chai-http](https://www.npmjs.com/package/chai-http) - Used for doing HTTP requests in the tests
## Regarding documentation
- [yamljs](https://www.npmjs.com/package/yamljs)
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)
## For HTTP logging
- [morgan (not in use)](https://www.npmjs.com/package/morgan). [Explanation](https://www.geeksforgeeks.org/what-is-morgan-in-node-js/)

## Recommended package and run command during development:
- [nodemon](https://www.npmjs.com/package/nodemon/v/1.18.10)
You can optionally install it globally since it's not a component that is part of our code, using the npm flag: -g. Run like: nodemon <file.mjs>. This will make so we don't have to restart the server everytime we make changes to our code, which can make developing faster and easier.
- npm run dev

## About elastic search
It's a NoSQL and document structured database called [Elastic Search](https://www.elastic.co/downloads/elasticsearch) which was built using Java and runs w/ the JVM. It stores our data in JSON format, which is an advantage because we're using JS, so the there's a high interoperability between the database and our server. It can be accessed by an HTTP API and follows the REST principles. Elastic Search 8.5.3 is 600mb, once it is ran. An Elastic Search cluster is created once you run it, it's a group of one or more Elasticsearch nodes instances that are connected together, which store our data. Elastic Search is by default running in port 9200
### Changes done to Elastic Search files in order to work easily
#### In `elasticsearch-8.5.3/config/elasticsearch.yml`, add:
1. ingest.geoip.downloader.enabled: false ([source](https://stackoverflow.com/a/72626114/9375488))
2. [source](https://stackoverflow.com/a/44358409/9375488)
- - transport.host: localhost
- - network.host: 192.168.1.126
3. Disable logins and SSL by putting them all false
- xpack.security.enabled: false
- xpack.security.enrollment.enabled: false
- xpack.security.http.ssl: 
- - **enabled: false**
- xpack.security.transport.ssl:
- - **enabled: false**

## Paths to consult data in the DB
- http://localhost:9200/_cat
- http://localhost:9200/_all
- http://localhost:9200/_cat/indices
- http://localhost:9200/users/_doc/{_id}
- http://localhost:9200/movies/_search