FROM node:alpine

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

RUN apk add --no-cache postgresql-client
RUN apk add --no-cache redis

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start:dev"]