FROM node:14 as builder 

COPY package*.json ./
RUN npm install

FROM node:alpine as app

USER node

WORKDIR /home/node/

ENV NODE_ENV production

RUN ["mkdir", "storeArchive"]
RUN ["mkdir", "config"]
RUN ["touch", "store"]

COPY --from=builder node_modules/ node_modules/

COPY lang/ lang/
COPY public/ public/
COPY routes/ routes/
COPY views/ views/
COPY *.js ./
COPY bin/ bin/

EXPOSE 8080

CMD [ "node", "main.js" ]
