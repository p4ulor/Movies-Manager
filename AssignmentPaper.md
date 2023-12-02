# Part 1 -----------------------
# Introduction

The practical component evaluation for this course will be carried out based on the CMDB (Chelas Movies DataBase) application, to be developed throughout the semester. This application provides access, through a web interface (hypermedia), to some of the features provided by the [IMDB] website (https://www.imdb.com/), making use of its Web API for this purpose:
[https://imdb-api.com/api/](https://imdb-api.com/api/). 
To enable access to this API, each student should use the IMDB API key obtained for 1st assignment.  That key must be included in the URL of each HTTP request.
Note that this is a free API, and therefore it is expected that you comply with the [Rate Limits and Good Citizenship rules](https://imdb-api.com/pricing).

The development will be carried out incrementally, necessarily involving several code refactoring cycles and, therefore, it is essential that you make use of good programming practices in general, in order to reduce the effort associated with each cycle.

The development of the CMDB application has 3 development cycles, phased in three parts (Part 1, Part 2 and Part 3). For each one, the deadline for delivering the solution will be defined, and it will be a non-negotiable requirement.

For each CMDB functionality, the corresponding HTTP *endpoint* must be defined. The description of the application API (i.e all application endpoints) must appear on the repository in an [OpenAPI](https://oai.github.io/Documentation/specification.html) file, named `docs/cmdb-api-spec.json` (or .yml). The repository must also contain the Postman collection export, with the requests that validate the API, in a file named  `docs/cmdb-api-test.json`.

Summary of the artifacts to be submitted upon delivery:

* OpenAPI/Swagger file with API documentation - `docs/cmdb-api-spec.[yaml|json]` 
* Postman API validation project for CMDB application - `docs/cmdb-api-test.json`
* Node.js CMDB application files

# Functional Requirements

Develop a web application that provides a web API that follows the REST principles, with responses in JSON format and that supports the following features:

* Get the list of the most popular movies. The request has an optional parameter to limit the number of returned movies (max 250) 
* Search movies by name. The request has an optional parameter to limit the number of returned movies (max 250) 
* Manage favorite movies groups
  * Create group providing its name and description
  * Edit group by changing its name and description
  * List all groups
  * Delete a group
  * Get the details of a group, with its name, description, the names and total duration of the included movies
  * Add a movie to a group
  * Remove a movie from a group
* Create new user
  
For all group operations, a user token must be sent in the [Authorization header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) using a Bearer Token. This token is generated at user creation, and consists of a UUID string, obtained from the `crypto.randomUUID()` method.

# Non-Functional Requirements

The application must be developed with Node.js technology. To handle/receive HTTP requests, the [express](https://expressjs.com/) module must be used. To make HTTP requests, the [node-fetch](https://www.npmjs.com/package/node-fetch) module must be used.

The Internet Movies Database API is used to obtain data (query) about the moviesˇ.

The data that are specific to the application, which can be created, altered and deleted, namely the entire group management, must be stored in memory.

Any of the base modules of Node.js can be used. In addition to these, in this 1st part of the work, only the following modules can be used:

* express - Handling HTTP requests
* node-fetch - Making HTTP requests
* debug – Debug messages
* mocha and chai - Unit tests
  
Any other module you intend to use must be previously discussed and authorized by the corresponding teacher.

All PUT and POST requests must send their data in the request body (_body_) and never in the _query string_. The body should be handled by [builtin Express JSON middleware](https://expressjs.com/en/4x/api.html#express.json).

The server application must consist of <u>at least</u> 5 Node modules:

* <code>cmdb-server.mjs</code> - file that constitutes the entry point to the server application
* <code>cmdb-web-api.mjs</code> - implementation of the HTTP routes that make up the REST API of the web application
* <code>cmdb-services.mjs</code> - implementation of the logic of each of the application's functionalities
* <code>imdb-movies-data.mjs</code> - access to the Internet Movies Database API.
* <code>cmdb-data-mem.mjs</code> - access to cmdb data (groups and users), in this version stored in memory .

The dependencies between these modules are as follows:

<pre>
cmdb-server.mjs -> cmdb-web-api.mjs -> cmdb-services.mjs -> imdb-movies-data.mjs
                                                         -> cmdb-data-mem.mjs
</pre>

The server application development methodology must be as follows and in this order:

1. Design and document API routes (HTTP request type + URL+example response content) using OpenAPI/Swagger format.
2. Create a collection in Postman (ex. CMDB) to test API routes
3. Implement the server application input module: <code>cmdb-server.mjs</code>. For this module it is not necessary to create unit tests, since it must not implement any logic other than receiving some arguments from the command line (configuration), registering routes and starting the web server. This module can be built as each route in cmdb-web-api.mjs is implemented.
4. In the <code>cmdb-web-api.mjs</code> module implement the API routes one by one.
   * For each route implemented, use Postman tests to verify the correct functioning of that route.
   * Only move on to implementing the next route when the previous one is fully implemented and tested.
   * For each route, create a request in the Postman collection that validates it.
   * In this phase of the implementation of the module <code>cmdb-web-api.mjs</code> **use local data (*mock* of <code>cmdb-service.mjs</code>)**, that is, testing must be performed without access to the IMDB API or ElasticSearch.
  
5. Implement application services in cmdb-services.mjs module.
   * Follow an approach similar to the one used in `cmdb-web-api.mjs` in the development of the features of this module and respective unit tests.
   * `cmdb-services.mjs` module unit tests must be run without access to the Internet Movies Database API (`imdb-movies-data.mjs`).
6. Implement data access modules:
   * <code>`imdb-movies-data.mjs`</code> - access to the Internet Movies Database API.
   * <code>`cmdb-data-mem.mjs`</code> - access groups data.

# Part 2 -----------------------
The main goals of this part are adding a Web user interface to the CMDB application developed in part 1, storing data in a database instead of memory, and incorporating new technologies and techniques covered in lectures.

## Functional requirements

1. Add the following to CMDB Web API:
    1. Support more than one group with the same name, irrespective of its owner user.  
    2. Create a new resource that returns the movie details (**this is not a search by id**), which must include at least:  id, title, description,image_url, runtimeMins, director and actor’s names.

1. Create a web interface for presentation in a _web browser_, for all the functionalities provided by the Web API. All operations that in Web Api are implemented with PUT and DELETE methods, except for user creation, must be implemented using the POST method using HTML forms.. This web interface is server-side rendered, using the following technologies: HTML, CSS, and Handlebars. You may use Bootstrap for the base style of the user interface.

When using the web application, in no situation the (human) user will have to know and/or introduce any id for groups or movies. The only situations in which it is allowed to write the name of a movie is to carry out searches in order to obtain a list of results. The only situation in which it is allowed to manually enter the name of a group is when creating or editing that group.

## Non-functional requirements

1. The web HTML and CSS interface should be implemented in a new file called `cmdb-web-site.js` that should be at the same level as `cmdb-web-api.js`   
2. Create a new module that replaces `cmdb-data-mem.js` so that the data is stored in an ElasticSearch database. This change should not imply any additional change in the remaining modules of the application besides module loading in `cmdb-server`. The interaction with ElasticSearch must be done through its HTTP API, without using any specific node module, besides `node-fetch`.
3. Create integration tests for the API with [supertest](https://www.npmjs.com/package/supertest) module.
4. In addition to the previous requirements, this part of work should be used to improve the code quality as well as the quality and quantity of tests, whether unit or integration.


The server application modules dependencies should be as follows:

![Module dependencies1](http://www.plantuml.com/plantuml/png/NOz1QiGm34NtEeLw05-X3EqHkXowa6sHcCHMa9MKeVJkjJDX9ip2wEjzVIDTgf7QccTuiv4pOvtOmdY3EgMoa5B63mhJeBAM-2cpA9fIgStYOgUf87cHqjYNtMP6vM1KXfd1P44Jz68c6MFgJf82y4XWoD7ZBrnxTJ_i7Itf6wbYgoTQa_6EkpXuPTrIu7hdHtDuqUyqUhYctcVP4bSNoMWtkW2W9Q5pxyzm__s576AdFVL2FFoTptbkndhVIpTe3vscORIMw0DmuHBNFFy3)

# Part 3 -----------------------
The main goals of this part are adding authentication to the web application with user interface (web site), and support the PUT and DELETE operations not implemented in the previous phase, using JavaScript on the client side.

## Functional requirements

1. Add user registration and authentication functionality to the CMDB application. All movie group management features must be accessible only to authenticated users. Groups are private to each user and can only be manipulated by their owner. The authentication must be implemented with the [`Passport`](https://www.passportjs.org/) module.

2. All functionalities available in the Web API developed in CMDB part 1, must be available also through the user interface available at the web site, namely those that are available with the PUT and DELETE HTTP methods.  

Again, as it was a requirement for part 2, when using the web application, in no situation the (human) user will have to know and/or introduce any id for groups or movies. The only situations in which it is allowed to write the name of a movie is to carry out searches in order to obtain a list of results. The only situation in which it is allowed to manually enter the name of a group is when creating or editing that group.
  
## Non-functional requirements

1. With this part of the work, a report must be delivered to the group's repository wiki, describing the implementation of the full work developed during the semester. Thus, the intermediate states that the implementation went through in each of the phases should not be included. The report must include:
    * Description of the application structure, in both components (server and client).
    * Data storage design (i.e. in ElasticSearch), namely: index or indices; document properties; relations between documents, if exit; etc.
    * Description of the mapping between the ElastictSearch’s Cmdb documents and the web application objects model.
    * Server API documentation.
    * Instructions for **<u>all</u>** the previous steps that are necessary to run the application and the respective tests.
      * These steps must include the actions necessary for the automatic introduction of test data, so that it is possible to run the application with data.
      * Instructions must have all the information needed to run the application on any machine, namely the teacher's. The instructions to make the application run should be executed in a maximum of 5 min.

