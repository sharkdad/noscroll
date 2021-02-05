FROM python:latest
RUN pip install --upgrade pip

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y yarn

WORKDIR /noscroll
COPY requirements.txt .
RUN pip install -r requirements.txt

WORKDIR /noscroll/ui
COPY ./ui/package.json ./ui/yarn.lock ./

RUN yarn install

WORKDIR /noscroll
COPY . ./
RUN python manage.py collectstatic --no-input

WORKDIR /noscroll/ui
RUN yarn build

WORKDIR /noscroll
EXPOSE 8001
CMD ["gunicorn", "--bind=127.0.0.1:8001", "--threads=10", "project.wsgi"]
