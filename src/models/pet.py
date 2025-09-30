from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Pet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    species = db.Column(db.String(20), nullable=False)  # 'dog' ou 'cat'
    breed = db.Column(db.String(100))
    birth_date = db.Column(db.Date)
    gender = db.Column(db.String(1))  # 'M' ou 'F'
    weight = db.Column(db.Float)
    owner_name = db.Column(db.String(100))
    owner_phone = db.Column(db.String(20))
    owner_email = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)
    
    # Relacionamento com vacinações
    vaccinations = db.relationship('Vaccination', backref='pet', lazy=True, cascade='all, delete-orphan')
    parasitic_controls = db.relationship('ParasiticControl', backref='pet', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Pet {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'species': self.species,
            'breed': self.breed,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'gender': self.gender,
            'weight': self.weight,
            'owner_name': self.owner_name,
            'owner_phone': self.owner_phone,
            'owner_email': self.owner_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'active': self.active
        }

class Vaccination(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pet.id'), nullable=False)
    vaccine_name = db.Column(db.String(100), nullable=False)
    vaccine_type = db.Column(db.String(50))  # V8, V10, V4, V5, FELV, etc.
    dose_number = db.Column(db.Integer)  # 1ª, 2ª, 3ª dose
    application_date = db.Column(db.Date, nullable=False)
    next_dose_date = db.Column(db.Date)
    veterinarian = db.Column(db.String(100))
    batch_number = db.Column(db.String(50))
    weight_at_vaccination = db.Column(db.Float)
    observations = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Vaccination {self.vaccine_name} - {self.pet.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'vaccine_name': self.vaccine_name,
            'vaccine_type': self.vaccine_type,
            'dose_number': self.dose_number,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'next_dose_date': self.next_dose_date.isoformat() if self.next_dose_date else None,
            'veterinarian': self.veterinarian,
            'batch_number': self.batch_number,
            'weight_at_vaccination': self.weight_at_vaccination,
            'observations': self.observations,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ParasiticControl(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pet.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    product_type = db.Column(db.String(50))  # vermífugo, antipulgas, etc.
    application_date = db.Column(db.Date, nullable=False)
    next_application_date = db.Column(db.Date)
    dose = db.Column(db.String(50))
    weight_at_application = db.Column(db.Float)
    veterinarian = db.Column(db.String(100))
    observations = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<ParasiticControl {self.product_name} - {self.pet.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'product_name': self.product_name,
            'product_type': self.product_type,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'next_application_date': self.next_application_date.isoformat() if self.next_application_date else None,
            'dose': self.dose,
            'weight_at_application': self.weight_at_application,
            'veterinarian': self.veterinarian,
            'observations': self.observations,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
