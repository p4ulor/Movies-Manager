## In order too use, first install the package.json dependencies 
- npm install

## Plain run:
- node cmdb-server.mjs
or
- npm run start

## Dev run to auto restart on code changes
- npm run dev

## Run mocha tests
- npm run test

## NPM Packages/dependencies included:
### For creating and managing the server
- [express](https://www.npmjs.com/package/express) - For Handling HTTP requests
- [node-fetch](https://www.npmjs.com/package/node-fetch) - For Making server side HTTP requests
- [cookie-parser](https://www.npmjs.com/package/cookie-parser)
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

## Recommended package and run command during development:
- [nodemon](https://www.npmjs.com/package/nodemon/v/1.18.10)
You can optionally install it globally since it's not a component that is not part of our code, using the npm flag: -g. Run like: nodemon <file.mjs>. This will make so we don't have to restart the server everytime we make changes, which can make developing faster and easier.
- npm run dev

Should we add `jest-openapi` used in the classes?