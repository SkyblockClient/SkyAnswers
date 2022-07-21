FROM node:lts-alpine
ENV NODE_ENV=production
RUN apk add --no-cache build-base gcompat
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
RUN chown -R node /usr/src/app
USER node
CMD ["npx", "node", "."]

