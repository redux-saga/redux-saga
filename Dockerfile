FROM node:14
COPY ./examples/real-world /app
WORKDIR /app
RUN npm install -s --no-progress
ENTRYPOINT npm run start
