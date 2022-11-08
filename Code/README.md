## In order too use, first install the package.json dependencies 
- npm install

## Then run like:
- node cmdb-server.mjs
or
- npm run

## NPM Packages/dependencies included:
- [express](https://www.npmjs.com/package/express) - For Handling HTTP requests
- [node-fetch](https://www.npmjs.com/package/node-fetch) - For Making HTTP requests
- [mocha](https://www.npmjs.com/package/mocha) and [chai](https://www.npmjs.com/package/chai) - For Unit testing
- [deep-equal-in-any-order](https://www.npmjs.com/package/deep-equal-in-any-order) - A plugin for chai that makes testing complex objects easier

## Recommended package during development:
- [nodemon](https://www.npmjs.com/package/nodemon/v/1.18.10)
Install globally since it's not a component that is part of our code, using the npm flag: -g. Run like: nodemon <file.mjs>. This will make so we don't have to restart the server everytime we make changes, which can make developing faster and easier.
- npm run dev

Should we add `jest-openapi` used in the classes?