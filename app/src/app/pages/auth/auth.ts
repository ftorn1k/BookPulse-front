import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './auth.html',
})
export class Auth {
    submitting = false;
    errorText = '';
    private fb = inject(FormBuilder);
    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });
    private auth = inject(AuthService);
    private router = inject(Router);

    submit() {
        this.errorText = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.errorText = 'Заполни почту и пароль';
            return;
        }

        const {email, password} = this.form.value;

        this.submitting = true;

        this.auth.login(email!, password!).subscribe({
            next: () => {
                this.submitting = false;
                this.router.navigate(['/']);
            },
            error: (e) => {
                this.submitting = false;

                const msg =
                    (typeof e?.error === 'string' && e.error) ||
                    e?.error?.message ||
                    (e?.status === 401 ? 'Неверная почта или пароль' : 'Ошибка авторизации');

                this.errorText = msg;
                console.error('login error', e);
            },
        });
    }
}
