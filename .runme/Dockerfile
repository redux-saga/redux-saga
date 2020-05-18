FROM node:14
COPY ./examples/real-world/ /app
WORKDIR /app
RUN npm install -s --no-progress
RUN npm install -g webpack webpack-dev-server npm i -D webpack-cli
CMD ["webpack-dev-server", "--port", "3000", "--hot", "--host", "0.0.0.0"]