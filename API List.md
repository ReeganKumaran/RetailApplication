 # API List

 Base URL: `http://localhost:5000`

 Auth:
  - Use header: `Authorization: Bearer <token>`
  - Obtain token from the `/login` response (also set as `token` cookie).
  - Content type: `application/json`

 Response format:
 - Success: `{ success: true, message, statusCode, status: "OK", data }`
 - Error: `{ success: false, message, statusCode, status: "ERROR" }`

 ## Root
 - GET `/`
   - Returns: success envelope with app name and uptime.

 ## Auth
 - POST `/signup`
   - Body: `{ "username": string, "email": string, "password": string }`
   - 201 Created: `res.success({}, "User registered successfully")`
   - 400: `res.error("Email already exists")`
   - 500: `res.error("Internal Server Error")`

 - POST `/login`
   - Body: `{ "email": string, "password": string }`
 - 200 OK: `res.success({ username, token }, "Login successful")` and sets `token` cookie (httpOnly)
   - 400: `res.error("Invalid email or password")`
   - 500: `res.error("Internal Server Error")`

 Example:
 ```bash
 curl -s -X POST http://localhost:5000/login \
   -H 'Content-Type: application/json' \
   -d '{"email":"you@example.com","password":"secret"}'
 ```

 ## Users
 - GET `/allUser`
   - Auth: required (`Authorization: Bearer <token>`)
   - 200 OK: `res.success(User[], "Users fetched successfully")`
   - 500: `res.error("Internal Server Error")`

 Example:
 ```bash
 curl -s http://localhost:5000/allUser \
   -H "Authorization: Bearer $TOKEN"
 ```

 ## Clients
  - GET `/clients`
    - Auth: required
    - Effect: Returns all clients for the authenticated user.
    - 200 OK: `res.success(Client[], "Clients fetched successfully")`
    - 500: `res.error("Internal Server Error")`

  - POST `/clients`
    - Auth: required
    - Body: `{ "username": string, "phoneNumber": string }`
    - Effect: Creates a Client document for the authenticated user.
    - 201 Created: `res.success({ id }, "Client added successfully")`
    - 500: `res.error("Something Went Wrong")`

 Example:
 ```bash
 curl -s -X POST http://localhost:5000/clients \
   -H 'Content-Type: application/json' \
   -H "Authorization: Bearer $TOKEN" \
   -d '{"username":"user123","phoneNumber":"73787878565"}'

 # Fetch clients for authenticated user
 curl -s http://localhost:5000/clients \
   -H "Authorization: Bearer $TOKEN"
 ```

 Notes:
 - JWT secret: `process.env.JWT_SECRET` (defaults to `"default_secret"` if unset).
 - MongoDB URI from `.env` `MONGODB_URI` (default sample: `mongodb://localhost:27017/Invoice`).
