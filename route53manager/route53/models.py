import simplejson

from route53 import app

from flaskext.sqlalchemy import SQLAlchemy

# initialize db
db = SQLAlchemy(app)

# Models


class ChangeBatch(db.Model):
    __tablename__ = "change_batches"

    id = db.Column(db.Integer, primary_key=True)
    change_id = db.Column(db.String(255))
    status = db.Column(db.String(255))
    comment = db.Column(db.String(255))

    changes = db.relation("Change", backref="change_batch")

    def process_response(self, resp):
        change_info = resp['ChangeResourceRecordSetsResponse']['ChangeInfo']
        self.change_id = change_info['Id'][8:]
        self.status = change_info['Status']


class Change(db.Model):
    __tablename__ = "changes"

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(255))
    name = db.Column(db.String(255))
    type = db.Column(db.String(255))
    ttl = db.Column(db.String(255))
    value = db.Column(db.String(255))
    Registered = db.Column(db.DateTime, nullable = False)
    change_batch_id = db.Column(db.Integer, db.ForeignKey("change_batches.id"))

    @property
    def values(self):
        return simplejson.loads(self.value)

    @values.setter
    def values(self, values):
        self.value = simplejson.dumps(values)
