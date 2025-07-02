import { createServer, Model, hasMany, belongsTo } from 'miragejs';

const mockEmployees = [ 
  { id: '1', name: 'Shalin Jain', designation: 'CEO', team: 'Executive', managerId: null, email: 'ceo@happyfox.com', phone: '+1-555-0101', avatar: 'https://media.licdn.com/dms/image/v2/C4D03AQHn8Y0COf-MKQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1596055779240?e=1756339200&v=beta&t=e_SYSOcTY0MrfQl2mDrbEvmDQwYcFbrMlHj8xtNKV88' },
  { id: '2', name: 'Pradeek J', designation: 'CTO', team: 'Technology', managerId: '1', email: 'cto@happyfox.com', phone: '+1-555-0102', avatar: 'https://media.licdn.com/dms/image/v2/C5103AQFS5UxdutRPQA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1571020633054?e=1756339200&v=beta&t=LDYtDqTzPkJUdhW1zr4_zYC_J9QnLeCCrvKtRXP88r8' },
  { id: '3', name: 'Sharon Samuel ', designation: 'HR Manager', team: 'Human Resource', managerId: '1', email: 'hrmanager@happyfox.com', phone: '+1-555-0103', avatar: 'https://media.licdn.com/dms/image/v2/D5635AQEh41A9S_ysUg/profile-framedphoto-shrink_400_400/B56ZcP.CfQHwAc-/0/1748319611113?e=1751590800&v=beta&t=PJ-NzxSwBbt3l-uiH4joDkoKT_UZMlqwgjh6MNqte7A' },
  { id: '4', name: 'Suresh S', designation: 'Engineering Manager', team: 'Technology', managerId: '1', email: 'engineeringmanager@happyfox.com', phone: '+1-555-0105', avatar: 'https://media.licdn.com/dms/image/v2/C5603AQG9SXQjsviJQQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1650894935461?e=1756339200&v=beta&t=f_4qZRvz7pC_JOHeEln1geL5f53LqplKGwKB1ijCUEI' },
  { id: '5', name: 'Rajkiran k.b', designation: 'Staff Engineer', team: 'Technology', managerId: '2', email: 'staffengg5@happyfox.com', phone: '+1-555-0104', avatar: 'https://media.licdn.com/dms/image/v2/C4E03AQHaZkye6Gm3zw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1517433775701?e=1756339200&v=beta&t=nsi6Zf_1iOMIV9z2gcm2iTv4xKxW5HuaIcH0cFIcC38' },
  { id: '6', name: 'Abraham Samuel E', designation: 'Frontend Developer', team: 'Technology', managerId: '5', email: 'frontenddev6@happyfox.com', phone: '+1-555-0106', avatar: 'https://media.licdn.com/dms/image/v2/D5603AQHjc25QcJL8wg/profile-displayphoto-shrink_800_800/B56ZRLEJWhHoAc-/0/1736426166205?e=1756339200&v=beta&t=NepH8tndHJCsFsBXxm5rCtuKv0jCJDtirCdWElayGC0' },
  { id: '7', name: 'Godwin JebaKumar', designation: 'Staff Engineer', team: 'Technology', managerId: '2', email: 'staffengg7@happyfox.com', phone: '+1-555-0107', avatar: 'https://media.licdn.com/dms/image/v2/C4D03AQF1de2KLyUJHA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1516796310457?e=1756339200&v=beta&t=lmnvDhA53i0wL0oJbva0M8Gr-IssoQXxTnW_vFD78xw' },
  { id: '8', name: 'Krithika Krishnan', designation: 'Techruiter', team: 'Human Resource', managerId: '3', email: 'techruiter1@happyfox.com', phone: '+1-555-0108', avatar: 'https://cdn.vectorstock.com/i/2000v/54/41/young-and-elegant-woman-avatar-profile-vector-9685441.avif' },
  { id: '9', name: 'Sindhuja S', designation: 'SDET', team: 'Testing', managerId: '4', email: 'sdet1@happyfox.com', phone: '+1-555-0111', avatar: 'https://media.licdn.com/dms/image/v2/C5603AQGBACH9g0rvQg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1644486968691?e=1756339200&v=beta&t=ThFsFCT52677Ke1B-yI5gA9IfX6QQMDHmC51BckDVTk' },
  { id: '10', name: 'Sridhar Murali ', designation: 'Senior Frontend Engineer', team: 'Technology', managerId: '2', email: 'srfrontenddev10@happyfox.com', phone: '+1-555-0109', avatar: 'https://media.licdn.com/dms/image/v2/D5603AQHouxcmMY4kUg/profile-displayphoto-shrink_400_400/B56ZVR.Ug1HQAg-/0/1740837047349?e=1756339200&v=beta&t=Baxf4CrUF9JK9eCfBO5SHHPIlRAJ3pM1DbedRdJzYGI' },
 
];

export function makeServer({ environment = 'development' } = {}) {
  return createServer({
    environment,
    
    models: {
      employee: Model
    },

    seeds(server) {
      mockEmployees.forEach(employee => {
        server.create('employee', employee);
      });
    },

    routes() {
      this.namespace = 'api';
      this.timing = 500; // Simulate network delay

      this.get('/employees', (schema) => {
        return schema.employees.all();
      });

      this.get('/employees/:id', (schema, request) => {
        const id = request.params.id;
        return schema.employees.find(id);
      });

      this.post('/employees', (schema, request) => {
        const attrs = JSON.parse(request.requestBody);
        const newEmployee = {
          ...attrs,
          id: String(Math.max(...mockEmployees.map(e => parseInt(e.id))) + 1),
          avatar: attrs.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        };
        return schema.employees.create(newEmployee);
      });

      this.patch('/employees/:id', (schema, request) => {
        const id = request.params.id;
        const attrs = JSON.parse(request.requestBody);
        return schema.employees.find(id).update(attrs);
      });

      this.delete('/employees/:id', (schema, request) => {
        const id = request.params.id;
        return schema.employees.find(id).destroy();
      });
    }
  });
}