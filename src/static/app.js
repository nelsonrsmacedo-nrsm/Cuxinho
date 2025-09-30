// Estado global da aplicação
let currentUser = null;
let currentPetId = null;
let editingPetId = null;
let editingVaccinationId = null;
let editingUserId = null;

// Elementos DOM
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const userWelcome = document.getElementById('user-welcome');
const logoutBtn = document.getElementById('logout-btn');
const changePasswordBtn = document.getElementById('change-password-btn');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
    setupTabNavigation();
    setupModals();
});

// Verificar sessão ativa
async function checkSession() {
    try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showApp();
            loadDashboardData();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        showLogin();
    }
}

// Mostrar tela de login
function showLogin() {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    userWelcome.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    changePasswordBtn.classList.add('hidden');
}

// Mostrar aplicação
function showApp() {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userWelcome.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    changePasswordBtn.classList.remove('hidden');
    
    userWelcome.textContent = `Olá, ${currentUser.username}!`;
    
    // Mostrar/ocultar elementos baseado no perfil
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        if (currentUser.profile === 'admin') {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
    
    // Verificar permissões específicas
    checkUserPermissions();
}

// Verificar permissões do usuário
function checkUserPermissions() {
    if (currentUser.profile !== 'admin') {
        // Verificar acesso a vacinações
        if (!currentUser.permissions.can_access_vaccination) {
            const vaccinationTab = document.querySelector('[data-tab="vaccinations"]');
            if (vaccinationTab) vaccinationTab.style.display = 'none';
        }
        
        // Verificar acesso a pets
        if (!currentUser.permissions.can_manage_pets) {
            const petsTab = document.querySelector('[data-tab="pets"]');
            if (petsTab) petsTab.style.display = 'none';
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Alterar senha
    changePasswordBtn.addEventListener('click', () => {
        document.getElementById('change-password-modal').style.display = 'block';
    });
    
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    
    // Pets
    document.getElementById('add-pet-btn').addEventListener('click', () => {
        editingPetId = null;
        document.getElementById('pet-modal-title').textContent = '➕ Adicionar Pet';
        document.getElementById('pet-form').reset();
        document.getElementById('pet-modal').style.display = 'block';
    });
    
    document.getElementById('pet-form').addEventListener('submit', handlePetSubmit);
    
    // Vacinações
    document.getElementById('pet-select').addEventListener('change', function() {
        currentPetId = this.value;
        document.getElementById('add-vaccination-btn').disabled = !currentPetId;
        if (currentPetId) {
            loadVaccinations();
        }
    });
    
    document.getElementById('add-vaccination-btn').addEventListener('click', () => {
        editingVaccinationId = null;
        document.getElementById('vaccination-modal-title').textContent = '💉 Adicionar Vacinação';
        document.getElementById('vaccination-form').reset();
        document.getElementById('vaccination-modal').style.display = 'block';
    });
    
    document.getElementById('vaccination-form').addEventListener('submit', handleVaccinationSubmit);
    
    // Usuários
    document.getElementById('add-user-btn').addEventListener('click', () => {
        editingUserId = null;
        document.getElementById('user-modal-title').textContent = '👤 Adicionar Usuário';
        document.getElementById('user-form').reset();
        document.getElementById('user-active').checked = true;
        document.getElementById('user-can-access-vaccination').checked = true;
        document.getElementById('user-can-manage-pets').checked = true;
        document.getElementById('user-can-access-reports').checked = false;
        document.getElementById('user-modal').style.display = 'block';
    });
    
    document.getElementById('user-form').addEventListener('submit', handleUserSubmit);
    
    // Mostrar/ocultar permissões baseado no perfil
    document.getElementById('user-profile').addEventListener('change', function() {
        const permissions = document.getElementById('user-permissions');
        if (this.value === 'user') {
            permissions.classList.remove('hidden');
        } else {
            permissions.classList.add('hidden');
        }
    });
    
    // Relatórios
    document.getElementById('vaccination-schedule-btn').addEventListener('click', loadVaccinationSchedule);
}

// Configurar navegação por abas
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remover classe active de todas as abas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active na aba selecionada
            button.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Carregar dados da aba
            loadTabData(tabName);
        });
    });
}

// Configurar modais
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Carregar dados da aba
function loadTabData(tabName) {
    switch (tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'pets':
            loadPets();
            break;
        case 'vaccinations':
            loadPetSelect();
            break;
        case 'users':
            if (currentUser.profile === 'admin') {
                loadUsers();
            }
            break;
        case 'reports':
            // Relatórios carregados sob demanda
            break;
    }
}

// Handlers de eventos

// Login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showApp();
            loadDashboardData();
            showAlert('login-alert', 'Login realizado com sucesso!', 'success');
        } else {
            showAlert('login-alert', data.error || 'Erro no login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('login-alert', 'Erro de conexão', 'error');
    }
}

// Logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        showLogin();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Alterar senha
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showAlert('change-password-alert', 'As senhas não coincidem', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('change-password-alert', 'Senha alterada com sucesso!', 'success');
            document.getElementById('change-password-form').reset();
            setTimeout(() => {
                document.getElementById('change-password-modal').style.display = 'none';
            }, 2000);
        } else {
            showAlert('change-password-alert', data.error || 'Erro ao alterar senha', 'error');
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        showAlert('change-password-alert', 'Erro de conexão', 'error');
    }
}

// Pet
async function handlePetSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('pet-name').value,
        species: document.getElementById('pet-species').value,
        breed: document.getElementById('pet-breed').value,
        birth_date: document.getElementById('pet-birth-date').value || null,
        gender: document.getElementById('pet-gender').value || null,
        weight: parseFloat(document.getElementById('pet-weight').value) || null,
        owner_name: document.getElementById('pet-owner-name').value,
        owner_phone: document.getElementById('pet-owner-phone').value,
        owner_email: document.getElementById('pet-owner-email').value
    };
    
    try {
        const url = editingPetId ? `/api/pets/${editingPetId}` : '/api/pets';
        const method = editingPetId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('pet-modal-alert', 'Pet salvo com sucesso!', 'success');
            loadPets();
            loadPetSelect();
            setTimeout(() => {
                document.getElementById('pet-modal').style.display = 'none';
            }, 1500);
        } else {
            showAlert('pet-modal-alert', data.error || 'Erro ao salvar pet', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar pet:', error);
        showAlert('pet-modal-alert', 'Erro de conexão', 'error');
    }
}

// Vacinação
async function handleVaccinationSubmit(event) {
    event.preventDefault();
    
    const formData = {
        vaccine_name: document.getElementById('vaccination-vaccine-name').value,
        vaccine_type: document.getElementById('vaccination-vaccine-type').value,
        dose_number: parseInt(document.getElementById('vaccination-dose-number').value) || null,
        application_date: document.getElementById('vaccination-application-date').value,
        next_dose_date: document.getElementById('vaccination-next-dose-date').value || null,
        weight_at_vaccination: parseFloat(document.getElementById('vaccination-weight').value) || null,
        veterinarian: document.getElementById('vaccination-veterinarian').value,
        batch_number: document.getElementById('vaccination-batch').value,
        observations: document.getElementById('vaccination-observations').value
    };
    
    try {
        const url = editingVaccinationId ? 
            `/api/vaccinations/${editingVaccinationId}` : 
            `/api/pets/${currentPetId}/vaccinations`;
        const method = editingVaccinationId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('vaccination-modal-alert', 'Vacinação salva com sucesso!', 'success');
            loadVaccinations();
            loadDashboardData();
            setTimeout(() => {
                document.getElementById('vaccination-modal').style.display = 'none';
            }, 1500);
        } else {
            showAlert('vaccination-modal-alert', data.error || 'Erro ao salvar vacinação', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar vacinação:', error);
        showAlert('vaccination-modal-alert', 'Erro de conexão', 'error');
    }
}

// Usuário
async function handleUserSubmit(event) {
    event.preventDefault();
    
    const formData = {
        username: document.getElementById('user-username').value,
        email: document.getElementById('user-email').value,
        profile: document.getElementById('user-profile').value,
        active: document.getElementById('user-active').checked
    };
    
    // Adicionar senha apenas se não estiver editando ou se foi fornecida
    const password = document.getElementById('user-password').value;
    if (!editingUserId || password) {
        formData.password = password;
    }
    
    // Adicionar permissões se for usuário comum
    if (formData.profile === 'user') {
        formData.can_access_vaccination = document.getElementById('user-can-access-vaccination').checked;
        formData.can_access_reports = document.getElementById('user-can-access-reports').checked;
        formData.can_manage_pets = document.getElementById('user-can-manage-pets').checked;
    }
    
    try {
        const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
        const method = editingUserId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('user-modal-alert', 'Usuário salvo com sucesso!', 'success');
            loadUsers();
            loadDashboardData();
            setTimeout(() => {
                document.getElementById('user-modal').style.display = 'none';
            }, 1500);
        } else {
            showAlert('user-modal-alert', data.error || 'Erro ao salvar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showAlert('user-modal-alert', 'Erro de conexão', 'error');
    }
}

// Funções de carregamento de dados

// Dashboard
async function loadDashboardData() {
    try {
        // Carregar estatísticas
        const [petsResponse, usersResponse] = await Promise.all([
            fetch('/api/pets'),
            currentUser.profile === 'admin' ? fetch('/api/users') : Promise.resolve({ json: () => [] })
        ]);
        
        if (petsResponse.ok) {
            const pets = await petsResponse.json();
            document.getElementById('total-pets').textContent = pets.length;
            
            // Contar vacinações
            let totalVaccinations = 0;
            for (const pet of pets) {
                const vacResponse = await fetch(`/api/pets/${pet.id}/vaccinations`);
                if (vacResponse.ok) {
                    const vaccinations = await vacResponse.json();
                    totalVaccinations += vaccinations.length;
                }
            }
            document.getElementById('total-vaccinations').textContent = totalVaccinations;
        }
        
        if (currentUser.profile === 'admin' && usersResponse.ok) {
            const users = await usersResponse.json();
            const activeUsers = users.filter(user => user.active);
            document.getElementById('total-users').textContent = activeUsers.length;
        }
        
        // Carregar próximas vacinações
        if (currentUser.profile === 'admin' || currentUser.permissions.can_access_reports) {
            const scheduleResponse = await fetch('/api/reports/vaccination-schedule');
            if (scheduleResponse.ok) {
                const schedule = await scheduleResponse.json();
                document.getElementById('upcoming-vaccinations').textContent = schedule.length;
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

// Pets
async function loadPets() {
    const loading = document.getElementById('pets-loading');
    const tableBody = document.getElementById('pets-table-body');
    
    loading.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/pets');
        if (response.ok) {
            const pets = await response.json();
            
            tableBody.innerHTML = '';
            pets.forEach(pet => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pet.name}</td>
                    <td>${pet.species === 'dog' ? 'Cão' : 'Gato'}</td>
                    <td>${pet.breed || '-'}</td>
                    <td>${pet.owner_name || '-'}</td>
                    <td>${pet.owner_phone || '-'}</td>
                    <td>
                        <button class="btn" onclick="editPet(${pet.id})" style="margin-right: 5px;">✏️ Editar</button>
                        <button class="btn btn-danger" onclick="deletePet(${pet.id})">🗑️ Excluir</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar pets:', error);
    } finally {
        loading.classList.add('hidden');
    }
}

// Carregar select de pets
async function loadPetSelect() {
    try {
        const response = await fetch('/api/pets');
        if (response.ok) {
            const pets = await response.json();
            const select = document.getElementById('pet-select');
            
            select.innerHTML = '<option value="">Selecione um pet...</option>';
            pets.forEach(pet => {
                const option = document.createElement('option');
                option.value = pet.id;
                option.textContent = `${pet.name} (${pet.species === 'dog' ? 'Cão' : 'Gato'})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar pets:', error);
    }
}

// Vacinações
async function loadVaccinations() {
    if (!currentPetId) return;
    
    try {
        const response = await fetch(`/api/pets/${currentPetId}/vaccinations`);
        if (response.ok) {
            const vaccinations = await response.json();
            const tableBody = document.getElementById('vaccinations-table-body');
            
            tableBody.innerHTML = '';
            vaccinations.forEach(vaccination => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vaccination.pet?.name || 'N/A'}</td>
                    <td>${vaccination.vaccine_name}</td>
                    <td>${vaccination.vaccine_type || '-'}</td>
                    <td>${vaccination.dose_number ? vaccination.dose_number + 'ª' : '-'}</td>
                    <td>${formatDate(vaccination.application_date)}</td>
                    <td>${vaccination.next_dose_date ? formatDate(vaccination.next_dose_date) : '-'}</td>
                    <td>
                        <button class="btn" onclick="editVaccination(${vaccination.id})" style="margin-right: 5px;">✏️ Editar</button>
                        <button class="btn btn-danger" onclick="deleteVaccination(${vaccination.id})">🗑️ Excluir</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar vacinações:', error);
    }
}

// Usuários
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            const users = await response.json();
            const tableBody = document.getElementById('users-table-body');
            
            tableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="badge badge-${user.profile}">${user.profile === 'admin' ? 'Admin' : 'Usuário'}</span></td>
                    <td><span class="badge badge-${user.active ? 'active' : 'inactive'}">${user.active ? 'Ativo' : 'Inativo'}</span></td>
                    <td>${user.last_login ? formatDateTime(user.last_login) : 'Nunca'}</td>
                    <td>
                        <button class="btn" onclick="editUser(${user.id})" style="margin-right: 5px;">✏️ Editar</button>
                        ${user.id !== currentUser.id ? `<button class="btn btn-danger" onclick="deleteUser(${user.id})">🗑️ Excluir</button>` : ''}
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

// Cronograma de vacinações
async function loadVaccinationSchedule() {
    try {
        const response = await fetch('/api/reports/vaccination-schedule');
        if (response.ok) {
            const schedule = await response.json();
            const container = document.getElementById('reports-content');
            
            if (schedule.length === 0) {
                container.innerHTML = '<div class="alert alert-success">Não há vacinações agendadas para os próximos 30 dias.</div>';
                return;
            }
            
            let html = '<div class="table-container"><table class="table"><thead><tr>';
            html += '<th>Pet</th><th>Vacina</th><th>Data Prevista</th><th>Proprietário</th><th>Telefone</th>';
            html += '</tr></thead><tbody>';
            
            schedule.forEach(item => {
                html += `<tr>
                    <td>${item.pet_name}</td>
                    <td>${item.vaccine_name}</td>
                    <td>${formatDate(item.next_dose_date)}</td>
                    <td>${item.owner_name || '-'}</td>
                    <td>${item.owner_phone || '-'}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar cronograma:', error);
    }
}

// Funções de edição e exclusão

// Editar pet
async function editPet(petId) {
    try {
        const response = await fetch(`/api/pets/${petId}`);
        if (response.ok) {
            const pet = await response.json();
            
            editingPetId = petId;
            document.getElementById('pet-modal-title').textContent = '✏️ Editar Pet';
            
            // Preencher formulário
            document.getElementById('pet-name').value = pet.name;
            document.getElementById('pet-species').value = pet.species;
            document.getElementById('pet-breed').value = pet.breed || '';
            document.getElementById('pet-birth-date').value = pet.birth_date || '';
            document.getElementById('pet-gender').value = pet.gender || '';
            document.getElementById('pet-weight').value = pet.weight || '';
            document.getElementById('pet-owner-name').value = pet.owner_name || '';
            document.getElementById('pet-owner-phone').value = pet.owner_phone || '';
            document.getElementById('pet-owner-email').value = pet.owner_email || '';
            
            document.getElementById('pet-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar pet:', error);
    }
}

// Excluir pet
async function deletePet(petId) {
    if (!confirm('Tem certeza que deseja excluir este pet?')) return;
    
    try {
        const response = await fetch(`/api/pets/${petId}`, { method: 'DELETE' });
        if (response.ok) {
            loadPets();
            loadPetSelect();
            loadDashboardData();
        }
    } catch (error) {
        console.error('Erro ao excluir pet:', error);
    }
}

// Editar vacinação
async function editVaccination(vaccinationId) {
    try {
        const response = await fetch(`/api/pets/${currentPetId}/vaccinations`);
        if (response.ok) {
            const vaccinations = await response.json();
            const vaccination = vaccinations.find(v => v.id === vaccinationId);
            
            if (vaccination) {
                editingVaccinationId = vaccinationId;
                document.getElementById('vaccination-modal-title').textContent = '✏️ Editar Vacinação';
                
                // Preencher formulário
                document.getElementById('vaccination-vaccine-name').value = vaccination.vaccine_name;
                document.getElementById('vaccination-vaccine-type').value = vaccination.vaccine_type || '';
                document.getElementById('vaccination-dose-number').value = vaccination.dose_number || '';
                document.getElementById('vaccination-application-date').value = vaccination.application_date;
                document.getElementById('vaccination-next-dose-date').value = vaccination.next_dose_date || '';
                document.getElementById('vaccination-weight').value = vaccination.weight_at_vaccination || '';
                document.getElementById('vaccination-veterinarian').value = vaccination.veterinarian || '';
                document.getElementById('vaccination-batch').value = vaccination.batch_number || '';
                document.getElementById('vaccination-observations').value = vaccination.observations || '';
                
                document.getElementById('vaccination-modal').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar vacinação:', error);
    }
}

// Excluir vacinação
async function deleteVaccination(vaccinationId) {
    if (!confirm('Tem certeza que deseja excluir esta vacinação?')) return;
    
    try {
        const response = await fetch(`/api/vaccinations/${vaccinationId}`, { method: 'DELETE' });
        if (response.ok) {
            loadVaccinations();
            loadDashboardData();
        }
    } catch (error) {
        console.error('Erro ao excluir vacinação:', error);
    }
}

// Editar usuário
async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
            const user = await response.json();
            
            editingUserId = userId;
            document.getElementById('user-modal-title').textContent = '✏️ Editar Usuário';
            
            // Preencher formulário
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-password').value = '';
            document.getElementById('user-password').placeholder = 'Deixe em branco para manter a senha atual';
            document.getElementById('user-profile').value = user.profile;
            document.getElementById('user-active').checked = user.active;
            
            // Preencher permissões
            if (user.permissions) {
                document.getElementById('user-can-access-vaccination').checked = user.permissions.can_access_vaccination;
                document.getElementById('user-can-access-reports').checked = user.permissions.can_access_reports;
                document.getElementById('user-can-manage-pets').checked = user.permissions.can_manage_pets;
            }
            
            // Mostrar/ocultar permissões
            const permissions = document.getElementById('user-permissions');
            if (user.profile === 'user') {
                permissions.classList.remove('hidden');
            } else {
                permissions.classList.add('hidden');
            }
            
            document.getElementById('user-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

// Excluir usuário
async function deleteUser(userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (response.ok) {
            loadUsers();
            loadDashboardData();
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao excluir usuário');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
    }
}

// Funções utilitárias

// Mostrar alerta
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Formatar data e hora
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}
