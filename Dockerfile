FROM python:latest
RUN pip install --upgrade pip
WORKDIR /noscroll
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . ./
EXPOSE 8000
CMD ["gunicorn", "--bind=0.0.0.0", "--threads=10", "project.wsgi"]