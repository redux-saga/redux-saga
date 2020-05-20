FROM node:12-alpine
COPY ./examples/real-world /app
WORKDIR /app
RUN npm install --save-dev --no-progress
ENTRYPOINT npm run start
