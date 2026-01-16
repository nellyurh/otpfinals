FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy application code
COPY . .

# Set build-time environment variable
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build the app
RUN yarn build

# Install serve
RUN npm install -g serve

# Railway provides PORT dynamically
ENV PORT=3000

# Start command
CMD serve -s build -l $PORT
