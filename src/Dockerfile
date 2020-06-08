FROM node:12-alpine

# Create app directory
WORKDIR /usr/src/app

#Creating Folder as mount destination /usr/src/app/output
RUN mkdir -p ./output && chown -R node:node ./output

# Install app dependencies
COPY package*.json ./
RUN npm install

COPY . .

CMD [ "node", "index.js" , "true"]