# Real-Time Twitter-Like Application

This project is a real-time Twitter-like application built with Python and JavaScript. It uses Flask, Flask-SocketIO on the server side and Socket.IO on the client side to enable real-time communication between the server and the client.

## Features

- Real-time message posting
- Real-time message updating
- Real-time message deletion
- Real-time message commenting
- Real-time message liking and unliking
- User avatar and username display

## Installation

1. Clone this repository:
    ```
    git clone https://github.com/cobaltCorsair/mybb_twitter.git
    ```
2. Navigate to the project directory:
    ```
    cd mybb_twitter
    ```
3. Install the required packages:
    ```
    pip install -r requirements.txt
    ```

## Usage

1. Start the server:
    ```
    python server.py
    ```
2. Open `client.html` in your web browser.

## Server API

The server provides several endpoints for real-time communication:

- `new user`: Handles new user creation.
- `create message`: Handles new message creation.
- `delete message`: Handles message deletion.
- `update message`: Handles message updating.
- `create comment`: Handles new comment creation.
- `delete comment`: Handles comment deletion.
- `like message`: Handles message liking.
- `remove like message`: Handles message unliking.

## Client

The client is a simple HTML page that uses Socket.IO to communicate with the server in real-time. It provides a user interface for creating, updating, deleting, commenting on, liking, and unliking messages.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Contact

If you want to contact me you can reach me at `cobaltcorsair@ya.ru`.
