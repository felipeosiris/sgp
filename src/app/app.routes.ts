import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        title: 'Login',
        loadComponent: () => import('./dashboard/dashboard.component'),
        children: [
            {
                path: '',
                redirectTo: '',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'home',
        title: 'Home',
        loadComponent: () => import('./dashboard/pages/home-view/home-view.component'),
        children: [
            {
                path: 'inbox-view',
                title: 'Inbox',
                loadComponent: () => import('./dashboard/pages/inbox-view/inbox-view.component')
            },
            {
                path: 'my-projects-view',
                title: 'Mis Proyectos',
                loadComponent: () => import('./dashboard/pages/my-projects-view/my-projects-view.component')
            },
            {
                path: 'main',
                title: 'Mi tiempo',
                loadComponent: () => import('./dashboard/pages/my-time-view/myTime-view.component')
            },
            {
                path: 'admin-view',
                title: 'admin',
                loadComponent: () => import('./dashboard/pages/admin-view/admin-view.component')
            },
            {
                path: 'project-view',
                title: 'Proyectos',
                loadComponent: () => import('./dashboard/pages/project/project-view.component')
            },
            {
                path: 'project-view/:id',
                title: 'Detalle de Proyecto',
                loadComponent: () => import('./dashboard/pages/project/project-view.component')
            },
            {
                path: 'personas',
                title: 'Personas',
                loadComponent: () => import('./dashboard/pages/personas/personas.component').then(m => m.PersonasComponent)
            },
            {
                path: 'tiempos',
                title: 'Tiempos',
                loadComponent: () => import('./dashboard/pages/tiempos/tiempos.component').then(m => m.TiemposComponent)
            },
            {
                path: 'mi-equipo',
                title: 'Mi equipo',
                loadComponent: () => import('./dashboard/pages/mi-equipo/mi-equipo.component').then(m => m.MiEquipoComponent)
            },
            {
                path: 'notifications',
                title: 'Notificaciones',
                loadComponent: () => import('./dashboard/pages/notifications-view/notifications.component').then(m => m.NotificationsComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
