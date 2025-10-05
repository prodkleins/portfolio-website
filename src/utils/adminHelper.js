class AdminHelper {
    constructor() {
        this.panel = null;
        this.mounted = false;
    }

    init(panelComponent) {
        this.panel = panelComponent;
        this.mounted = true;

        if (typeof window !== 'undefined') {
            window.admin = {
                open: () => this.open(),
                close: () => this.close(),
                status: () => this.showStatus(),
            };
        }
    }

    open() {
        if (!this.mounted || !this.panel) {
            console.error('Admin panel not initialized');
            return false;
        }

        try {
            this.panel.open();
            return true;
        } catch (error) {
            console.error('Failed to open admin panel:', error);
            return false;
        }
    }

    close() {
        console.log('Press ESC to close the panel or write "admin.close()" in the console');
    }

    showStatus() {
        const hasGistId = !!import.meta.env.VITE_GIST_ID;
        const hasToken = !!import.meta.env.VITE_GITHUB_TOKEN;
        const hasPassword = !!import.meta.env.VITE_ADMIN_PASSWORD;

        const status = {
            'Panel Mounted': this.mounted ? 'yes' : 'no',
            'Gist Configured': hasGistId ? 'yes' : 'no',
            'GitHub Token': hasToken ? 'yes' : 'no',
            'Admin Password': hasPassword ? 'yes' : 'no',
            'Environment': import.meta.env.MODE
        };

        console.log('%c System Status:', 'color: #fff; font-size: 16px; font-weight: bold; margin: 12px 0;');
        console.table(status);

        if (!hasGistId || !hasToken) {
            console.warn('Warning: Gist not fully configured. Check your .env file')
            console.log('Required variables:');
            console.log('  VITE_GIST_ID=your_gist_id');
            console.log('  VITE_GITHUB_TOKEN=your_token');
            console.log('  VITE_ADMIN_PASSWORD=your_password');
        }
    }

    destroy() {
        this.panel = null;
        this.mounted = false;

        if (typeof window !== 'undefined' && window.admin) {
            delete window.admin;
            console.log('Admin panel unloaded');
        }
    }
}

const adminHelper = new AdminHelper();
export default adminHelper;