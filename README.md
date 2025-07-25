
# ClipVault

<<<<<<< HEAD
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
=======
## License
This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.
>>>>>>> eb7e523 (Added Apache 2.0 License)

ClipVault is a web application that allows you to securely share files and text using a simple 4-digit code. It's designed for quick, secure, and temporary sharing of sensitive information.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License & Credits](#license--credits)

## Project Overview

ClipVault enables users to easily share files and text snippets with a unique 4-digit code. This code is used by the recipient to access the shared content. You can configure receiver limits and set an expiry for the shared data.

## Key Features

- **Secure Sharing:** Utilizes a 4-digit code system for secure content access.
- **File & Text Support:** Share both files and text snippets.
- **Configurable Receivers:** Limit the number of times the content can be accessed.
- **Expiration:** Set an expiry time for the shared content to ensure it's only available for a limited time.
- **Simple Interface:** User-friendly interface built with Tailwind CSS.

## Installation

To get ClipVault up and running locally, follow these steps:

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/)

### Steps

1.  **Clone the repository:**

    bash
    npm install
    1.  Open the ClipVault web application in your browser.
2.  Enter the text or upload the file you want to share.
3.  Configure the receiver limit and expiry time as needed.
4.  Click the "Share" button.
5.  A unique 4-digit code will be generated. Share this code with the intended recipient.

### Receiving Files and Text

1.  The recipient enters the 4-digit code in the "Receive" section of the ClipVault web application.
2.  If the code is valid and the receiver limit has not been reached, the content (file or text) will be displayed or available for download.
3.  Once the expiry time has passed or the receiver limit has been reached, the content will no longer be accessible.

## Tech Stack

- **Node.js:** JavaScript runtime environment for the backend.
- **Express.js:** Web application framework for Node.js, used for building the API.
- **MongoDB GridFS:** Used for efficient storage of files in MongoDB.
- **Tailwind CSS:** A utility-first CSS framework for styling the user interface.
- **Multer:** Node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files.

## API Endpoints

- `POST /api/send`:  Uploads files and/or text content.  Accepts `multipart/form-data` for files and `text` field for text content.
- `GET /api/receive/:code`: Retrieves shared content based on the provided 4-digit code.
- `GET /api/file/:id`:  Downloads a specific file from GridFS based on its ID.

## Environment Variables

Create a `.env` file in the root directory of the project. Add the following variables:


PORT=3000
MONGODB_URI=<your_mongodb_connection_string>
BASE_URL=http://localhost:3000 # URL of your application
> Replace `<your_mongodb_connection_string>` with your actual MongoDB connection string.  Adjust `BASE_URL` if your application is hosted on a different domain or port.  The `PORT` variable determines the port on which the server will listen.

## Contributing

We welcome contributions to ClipVault! If you'd like to contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise messages.
4.  Submit a pull request.

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License & Credits

ClipVault is licensed under the [MIT License](https://opensource.org/licenses/MIT).

This project utilizes the following dependencies:

-   [Node.js](https://nodejs.org/)
-   [Express.js](https://expressjs.com/)
-   [MongoDB](https://www.mongodb.com/)
-   [Tailwind CSS](https://tailwindcss.com/)
<<<<<<< HEAD
-   [Multer](https://github.com/expressjs/multer)
=======
-   [Multer](https://github.com/expressjs/multer)
>>>>>>> eb7e523 (Added Apache 2.0 License)
# text-file-share-with-codes
