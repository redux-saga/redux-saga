FROM node:14
COPY ./examples/real-world /app
WORKDIR /app
RUN npm install -s --no-progress
ENTRYPOINT cross-env BABEL_ENV=cjs node --require @babel/register server.js
