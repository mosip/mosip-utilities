FROM node AS build
WORKDIR ./
COPY package.json .
RUN npm install
COPY . .
ENV REACT_APP_ORGANISATION_NAME=mosip-intern
ENV REACT_APP_TOKEN=adf
EXPOSE 3000
CMD ["npm","start"]
# for production
# RUN npm run build 
#FROM nginx
# COPY --from=build ./build /usr/hare/nginx/html