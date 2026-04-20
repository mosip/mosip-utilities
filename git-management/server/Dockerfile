FROM ubuntu
FROM node

WORKDIR /server

COPY ["package.json", "package-lock.json", "./"]
# RUN ls
RUN npm install
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]