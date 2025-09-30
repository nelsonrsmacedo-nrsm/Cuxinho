from flask import Blueprint, jsonify, request, session
from datetime import datetime, date
from src.models.user import User, db
from src.models.pet import Pet, Vaccination, ParasiticControl

pet_bp = Blueprint('pet', __name__)

def require_auth():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    return None

def check_pet_permission():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    user = User.query.get(session['user_id'])
    if not user or not user.active:
        return jsonify({'error': 'Usuário inativo'}), 401
    
    if not user.is_admin() and not user.can_manage_pets:
        return jsonify({'error': 'Acesso negado. Usuário não tem permissão para gerenciar pets'}), 403
    
    return None

def check_vaccination_permission():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    user = User.query.get(session['user_id'])
    if not user or not user.active:
        return jsonify({'error': 'Usuário inativo'}), 401
    
    if not user.is_admin() and not user.can_access_vaccination:
        return jsonify({'error': 'Acesso negado. Usuário não tem permissão para acessar controle de vacinação'}), 403
    
    return None

# ROTAS PARA PETS
@pet_bp.route('/pets', methods=['GET'])
def get_pets():
    permission_error = check_pet_permission()
    if permission_error:
        return permission_error
    
    pets = Pet.query.filter_by(active=True).all()
    return jsonify([pet.to_dict() for pet in pets])

@pet_bp.route('/pets', methods=['POST'])
def create_pet():
    permission_error = check_pet_permission()
    if permission_error:
        return permission_error
    
    data = request.json
    
    # Validações
    if not data.get('name') or not data.get('species'):
        return jsonify({'error': 'Nome e espécie são obrigatórios'}), 400
    
    if data.get('species') not in ['dog', 'cat']:
        return jsonify({'error': 'Espécie deve ser "dog" ou "cat"'}), 400
    
    # Converter data de nascimento se fornecida
    birth_date = None
    if data.get('birth_date'):
        try:
            birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    pet = Pet(
        name=data['name'],
        species=data['species'],
        breed=data.get('breed'),
        birth_date=birth_date,
        gender=data.get('gender'),
        weight=data.get('weight'),
        owner_name=data.get('owner_name'),
        owner_phone=data.get('owner_phone'),
        owner_email=data.get('owner_email')
    )
    
    db.session.add(pet)
    db.session.commit()
    return jsonify(pet.to_dict()), 201

@pet_bp.route('/pets/<int:pet_id>', methods=['GET'])
def get_pet(pet_id):
    permission_error = check_pet_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    pet_data = pet.to_dict()
    
    # Incluir histórico de vacinações e controle parasitário
    pet_data['vaccinations'] = [v.to_dict() for v in pet.vaccinations]
    pet_data['parasitic_controls'] = [p.to_dict() for p in pet.parasitic_controls]
    
    return jsonify(pet_data)

@pet_bp.route('/pets/<int:pet_id>', methods=['PUT'])
def update_pet(pet_id):
    permission_error = check_pet_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    data = request.json
    
    # Converter data de nascimento se fornecida
    if data.get('birth_date'):
        try:
            pet.birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    # Atualizar campos
    pet.name = data.get('name', pet.name)
    pet.species = data.get('species', pet.species)
    pet.breed = data.get('breed', pet.breed)
    pet.gender = data.get('gender', pet.gender)
    pet.weight = data.get('weight', pet.weight)
    pet.owner_name = data.get('owner_name', pet.owner_name)
    pet.owner_phone = data.get('owner_phone', pet.owner_phone)
    pet.owner_email = data.get('owner_email', pet.owner_email)
    
    db.session.commit()
    return jsonify(pet.to_dict())

@pet_bp.route('/pets/<int:pet_id>', methods=['DELETE'])
def delete_pet(pet_id):
    permission_error = check_pet_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    pet.active = False  # Soft delete
    db.session.commit()
    return '', 204

# ROTAS PARA VACINAÇÕES
@pet_bp.route('/pets/<int:pet_id>/vaccinations', methods=['GET'])
def get_pet_vaccinations(pet_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    vaccinations = Vaccination.query.filter_by(pet_id=pet_id).order_by(Vaccination.application_date.desc()).all()
    return jsonify([v.to_dict() for v in vaccinations])

@pet_bp.route('/pets/<int:pet_id>/vaccinations', methods=['POST'])
def create_vaccination(pet_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    data = request.json
    
    # Validações
    if not data.get('vaccine_name') or not data.get('application_date'):
        return jsonify({'error': 'Nome da vacina e data de aplicação são obrigatórios'}), 400
    
    try:
        application_date = datetime.strptime(data['application_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    next_dose_date = None
    if data.get('next_dose_date'):
        try:
            next_dose_date = datetime.strptime(data['next_dose_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data da próxima dose inválido. Use YYYY-MM-DD'}), 400
    
    vaccination = Vaccination(
        pet_id=pet_id,
        vaccine_name=data['vaccine_name'],
        vaccine_type=data.get('vaccine_type'),
        dose_number=data.get('dose_number'),
        application_date=application_date,
        next_dose_date=next_dose_date,
        veterinarian=data.get('veterinarian'),
        batch_number=data.get('batch_number'),
        weight_at_vaccination=data.get('weight_at_vaccination'),
        observations=data.get('observations')
    )
    
    db.session.add(vaccination)
    db.session.commit()
    return jsonify(vaccination.to_dict()), 201

@pet_bp.route('/vaccinations/<int:vaccination_id>', methods=['PUT'])
def update_vaccination(vaccination_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    vaccination = Vaccination.query.get_or_404(vaccination_id)
    data = request.json
    
    # Converter datas se fornecidas
    if data.get('application_date'):
        try:
            vaccination.application_date = datetime.strptime(data['application_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    if data.get('next_dose_date'):
        try:
            vaccination.next_dose_date = datetime.strptime(data['next_dose_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data da próxima dose inválido. Use YYYY-MM-DD'}), 400
    
    # Atualizar campos
    vaccination.vaccine_name = data.get('vaccine_name', vaccination.vaccine_name)
    vaccination.vaccine_type = data.get('vaccine_type', vaccination.vaccine_type)
    vaccination.dose_number = data.get('dose_number', vaccination.dose_number)
    vaccination.veterinarian = data.get('veterinarian', vaccination.veterinarian)
    vaccination.batch_number = data.get('batch_number', vaccination.batch_number)
    vaccination.weight_at_vaccination = data.get('weight_at_vaccination', vaccination.weight_at_vaccination)
    vaccination.observations = data.get('observations', vaccination.observations)
    
    db.session.commit()
    return jsonify(vaccination.to_dict())

@pet_bp.route('/vaccinations/<int:vaccination_id>', methods=['DELETE'])
def delete_vaccination(vaccination_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    vaccination = Vaccination.query.get_or_404(vaccination_id)
    db.session.delete(vaccination)
    db.session.commit()
    return '', 204

# ROTAS PARA CONTROLE PARASITÁRIO
@pet_bp.route('/pets/<int:pet_id>/parasitic-controls', methods=['GET'])
def get_pet_parasitic_controls(pet_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    controls = ParasiticControl.query.filter_by(pet_id=pet_id).order_by(ParasiticControl.application_date.desc()).all()
    return jsonify([c.to_dict() for c in controls])

@pet_bp.route('/pets/<int:pet_id>/parasitic-controls', methods=['POST'])
def create_parasitic_control(pet_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    pet = Pet.query.get_or_404(pet_id)
    data = request.json
    
    # Validações
    if not data.get('product_name') or not data.get('application_date'):
        return jsonify({'error': 'Nome do produto e data de aplicação são obrigatórios'}), 400
    
    try:
        application_date = datetime.strptime(data['application_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    next_application_date = None
    if data.get('next_application_date'):
        try:
            next_application_date = datetime.strptime(data['next_application_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data da próxima aplicação inválido. Use YYYY-MM-DD'}), 400
    
    control = ParasiticControl(
        pet_id=pet_id,
        product_name=data['product_name'],
        product_type=data.get('product_type'),
        application_date=application_date,
        next_application_date=next_application_date,
        dose=data.get('dose'),
        weight_at_application=data.get('weight_at_application'),
        veterinarian=data.get('veterinarian'),
        observations=data.get('observations')
    )
    
    db.session.add(control)
    db.session.commit()
    return jsonify(control.to_dict()), 201

@pet_bp.route('/parasitic-controls/<int:control_id>', methods=['PUT'])
def update_parasitic_control(control_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    control = ParasiticControl.query.get_or_404(control_id)
    data = request.json
    
    # Converter datas se fornecidas
    if data.get('application_date'):
        try:
            control.application_date = datetime.strptime(data['application_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    if data.get('next_application_date'):
        try:
            control.next_application_date = datetime.strptime(data['next_application_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data da próxima aplicação inválido. Use YYYY-MM-DD'}), 400
    
    # Atualizar campos
    control.product_name = data.get('product_name', control.product_name)
    control.product_type = data.get('product_type', control.product_type)
    control.dose = data.get('dose', control.dose)
    control.weight_at_application = data.get('weight_at_application', control.weight_at_application)
    control.veterinarian = data.get('veterinarian', control.veterinarian)
    control.observations = data.get('observations', control.observations)
    
    db.session.commit()
    return jsonify(control.to_dict())

@pet_bp.route('/parasitic-controls/<int:control_id>', methods=['DELETE'])
def delete_parasitic_control(control_id):
    permission_error = check_vaccination_permission()
    if permission_error:
        return permission_error
    
    control = ParasiticControl.query.get_or_404(control_id)
    db.session.delete(control)
    db.session.commit()
    return '', 204

# ROTAS PARA RELATÓRIOS
@pet_bp.route('/reports/vaccination-schedule', methods=['GET'])
def get_vaccination_schedule():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    user = User.query.get(session['user_id'])
    if not user.is_admin() and not user.can_access_reports:
        return jsonify({'error': 'Acesso negado. Usuário não tem permissão para acessar relatórios'}), 403
    
    # Buscar próximas vacinações (próximos 30 dias)
    from datetime import timedelta
    today = date.today()
    next_month = today + timedelta(days=30)
    
    upcoming_vaccinations = Vaccination.query.filter(
        Vaccination.next_dose_date.between(today, next_month)
    ).join(Pet).filter(Pet.active == True).all()
    
    result = []
    for vaccination in upcoming_vaccinations:
        result.append({
            'pet_name': vaccination.pet.name,
            'pet_id': vaccination.pet_id,
            'vaccine_name': vaccination.vaccine_name,
            'next_dose_date': vaccination.next_dose_date.isoformat(),
            'owner_name': vaccination.pet.owner_name,
            'owner_phone': vaccination.pet.owner_phone
        })
    
    return jsonify(result)
