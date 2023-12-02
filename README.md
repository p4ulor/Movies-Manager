## Movie Manager
- This was done as an [Assignment](./AssignmentPaper.md) for the discipline Introduction to Programming in Web ([IPW](https://www.isel.pt/en/leic/introduction-internet-programming))
- A simple web-app which allows logged in users (and w/ their IMDB API key) to search, consult and manage movies in their groups/collections and also consult the actors and the movie information
- The users can edit the name & description of the groups, delete and add movies to the groups
- The most challenging thing was avoiding hardcoded logic into the handle bars views. This is may be why other and more popular frameworks are used

> [!IMPORTANT]  
> IMDB no longer provides free 100 API calls a day [due to free plan abuse](https://imdb-api.com/account/tickets)

## Technical details
- The back-end (server) runs with Node.js w/ the express framework (read [this](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction) to know what this means) and the front-end is generated via Handlebars
- The app can either run in memory mode or database mode (the DB is elasticsearch).~In either case, the data obtained from the IMDB API is cached if running in memory or saved in the DB if running w/ elasticsearch
- For more details on how to run and the packages used. [See this](./code/README.md)

## Demo



https://github.com/p4ulor/Movies-Manager/assets/32241574/b1e84167-0965-40c3-8bde-fbb849da7f62


