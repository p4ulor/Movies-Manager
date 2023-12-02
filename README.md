## Movie Manager
- This was done as an [Assignment](./AssignmentPaper.md) for the discipline Introduction to Programming in Web ([IPW](https://www.isel.pt/en/leic/introduction-internet-programming))
- A simple web-app which allows logged in users (and w/ their IMDB API key) to search, consult and manage movies in their groups/collections and also consult the actors and the movie information
- The users can edit the name & description of the groups, delete and add movies to the groups

## Technical details
- The back-end (server) runs with Node.js w/ the express framework (read [this](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction) to know what this means) and the front-end is generated via Handlebars
- The app can either run in memory mode or database mode (the DB is elasticsearch).~In either case, the data obtained from the IMDB API is cached if running in memory or saved in the DB if running w/ elasticsearch
- For more details on how to run and the packages used. [See this](./code/README.md)

## Demo


