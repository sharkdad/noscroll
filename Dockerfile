FROM python:latest
RUN pip install --upgrade pip

WORKDIR /noscroll
COPY requirements.txt .
RUN pip install -r requirements.txt

WORKDIR /noscroll/ui
COPY ui/package.json ui/yarn.lock ./
RUN yarn install

WORKDIR /noscroll
COPY . ./
RUN python manage.py collectstatic --no-input

WORKDIR /noscroll/ui
RUN yarn build

WORKDIR /noscroll
EXPOSE 8000
CMD ["gunicorn", "--bind=0.0.0.0", "--threads=10", "project.wsgi"]