import { createApp } from 'vue';
import AdminApp from './AdminApp.vue';
import './admin.css';
// 页面级样式必须在 admin.css 之后加载，避免被全局覆盖层反压。
import './admin/products.css';

createApp(AdminApp).mount('#admin-app');
