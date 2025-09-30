from flask import Blueprint, jsonify, request, session
from src.models.user import User, db

user_bp = Blueprint('user', __name__)

def require_auth():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    return None

def require_admin():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    user = User.query.get(session['user_id'])
    if not user or not user.is_admin():
        return jsonify({'error': 'Acesso negado. Apenas administradores podem realizar esta ação'}), 403
    return None

@user_bp.route('/users', methods=['GET'])
def get_users():
    admin_error = require_admin()
    if admin_error:
        return admin_error
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    admin_error = require_admin()
    if admin_error:
        return admin_error
    
    data = request.json
    
    # Validações
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email e password são obrigatórios'}), 400
    
    if len(data.get('password', '')) < 6:
        return jsonify({'error': 'Password deve ter pelo menos 6 caracteres'}), 400
    
    # Verificar se username já existe
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username já existe'}), 400
    
    # Verificar se email já existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já existe'}), 400
    
    user = User(
        username=data['username'], 
        email=data['email'],
        profile=data.get('profile', 'user'),
        active=data.get('active', True),
        can_access_vaccination=data.get('can_access_vaccination', True),
        can_access_reports=data.get('can_access_reports', False),
        can_manage_pets=data.get('can_manage_pets', True)
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    
    user = User.query.get_or_404(user_id)
    data = request.json
    
    # Verificar se username já existe (exceto para o próprio usuário)
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username já existe'}), 400
    
    # Verificar se email já existe (exceto para o próprio usuário)
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já existe'}), 400
    
    # Atualizar campos
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.profile = data.get('profile', user.profile)
    user.active = data.get('active', user.active)
    user.can_access_vaccination = data.get('can_access_vaccination', user.can_access_vaccination)
    user.can_access_reports = data.get('can_access_reports', user.can_access_reports)
    user.can_manage_pets = data.get('can_manage_pets', user.can_manage_pets)
    
    # Atualizar senha se fornecida
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password deve ter pelo menos 6 caracteres'}), 400
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    
    # Não permitir que o admin delete a si mesmo
    if session['user_id'] == user_id:
        return jsonify({'error': 'Não é possível deletar seu próprio usuário'}), 400
    
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/users/<int:user_id>/permissions', methods=['PUT'])
def update_user_permissions(user_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    
    user = User.query.get_or_404(user_id)
    data = request.json
    
    # Apenas atualizar permissões para usuários comuns
    if user.profile == 'user':
        user.can_access_vaccination = data.get('can_access_vaccination', user.can_access_vaccination)
        user.can_access_reports = data.get('can_access_reports', user.can_access_reports)
        user.can_manage_pets = data.get('can_manage_pets', user.can_manage_pets)
        
        db.session.commit()
        return jsonify(user.to_dict())
    else:
        return jsonify({'error': 'Não é possível alterar permissões de administradores'}), 400
