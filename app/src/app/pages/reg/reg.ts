import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reg.html',
  styleUrl: './reg.scss',
})
export class Reg {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  submitting = false;
  serverError = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  submit() {
    this.serverError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, passwordConfirm, acceptTerms } = this.form.value;

    if (password !== passwordConfirm) {
      this.form.get('passwordConfirm')?.setErrors({ mismatch: true });
      return;
    }

    if (!acceptTerms) {
      this.form.get('acceptTerms')?.setErrors({ required: true });
      return;
    }

    this.submitting = true;

    this.auth.register(email!, password!, 'User').subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl('/');
      },
      error: (e) => {
        this.submitting = false;

        const msg =
          (typeof e?.error === 'string' && e.error) ||
          e?.error?.message ||
          'Ошибка регистрации';

        this.serverError = msg;
        console.error('register error', e);
      },
    });
  }
}
