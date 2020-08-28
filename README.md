## Commands

Run these commands before running server.

```bash
1. yarn
2. docker-compose up -d (Make sure docker is available locally)
```

Run server.
```bash
yarn start
```
Server runs at port 3100.


## Usage

1. `/upload-csv` takes to the page to upload csv files.
2. `/dummy-user` creates a dummy-user and returns an authentication token.
3. `/user-detail/<limit>` returns the `limit` number of `user-detail` data.
4. `/user-detail-count/<jobTitle>` returns the count of users for the given `jobTitle`.
5. `/job-profile-count` returns the total count for `job-profile`.
6. `/dup-user-count` returns the total count for `duplicate-user`.
