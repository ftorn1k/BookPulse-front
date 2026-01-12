import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, MeUser } from '../../core/auth/auth.service';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type GenreStat = { genre: string; cnt: number };
type MonthStat = { month: string; cnt: number };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  user = signal<MeUser | null>(null);

  name = signal('');
  email = signal('');
  password = signal('');

  saving = signal(false);
  saveError = signal('');
  saveOk = signal(false);

  genreStats = signal<GenreStat[]>([]);
  monthStats = signal<MonthStat[]>([]);

  pieData = signal<ChartConfiguration<'pie'>['data']>({
    labels: [],
    datasets: [{ data: [] }],
  });

  barData = signal<ChartConfiguration<'bar'>['data']>({
    labels: [],
    datasets: [{ data: [] }],
  });

  pieOptions: ChartConfiguration<'pie'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 10,
        padding: 1,
        font: { size: 12 },

        generateLabels: (chart) => {
          const data = chart.data;
          if (!data.labels) return [];

          const labels = data.labels as string[];
          const ds = data.datasets[0];

          return labels.map((text, i) => {
            const value = (ds.data as any[])[i];

            const max = 22;
            const t = String(text);
            const parts = t.length > max
              ? [t.slice(0, max) + '…', t.slice(max)]
              : [t];

            return {
              text: parts as any, 
              fillStyle: (ds as any).backgroundColor?.[i],
              strokeStyle: (ds as any).borderColor?.[i],
              lineWidth: (ds as any).borderWidth,
              hidden: !chart.getDataVisibility(i),
              index: i,
            } as any;
          });
        },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${ctx.parsed}`,
      },
    },
  },
};

  barOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: any) => `Месяц: ${items?.[0]?.label ?? ''}`,
        label: (ctx: any) => `Добавлено: ${ctx.parsed.y}`,
      },
    },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { ticks: { maxRotation: 0, minRotation: 0 } },
  },
};


  initials = computed(() => {
    const u = this.user();
    const n = (u?.name || '').trim();
    if (!n) return 'U';
    return n.split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join('');
  });

  ngOnInit(): void {
    this.loadMe();
    this.loadStats();
  }

  private token() {
    return localStorage.getItem('token');
  }

  private loadMe() {
    this.auth.loadMe().subscribe({
      next: (u) => {
        this.user.set(u);
        this.name.set(u?.name ?? '');
        this.email.set(u?.email ?? '');
      },
      error: () => {
        this.router.navigateByUrl('/auth');
      },
    });
  }

  private loadStats() {
    const token = this.token();
    if (!token) return;

    this.http.get<{ genres: GenreStat[]; months: MonthStat[] }>('/api/me/stats', {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: (data) => {
        const genres = data?.genres ?? [];
        const months = data?.months ?? [];

        this.genreStats.set(genres);
        this.monthStats.set(months);

        this.pieData.set({
          labels: genres.map(x => x.genre),
          datasets: [{ data: genres.map(x => x.cnt) }],
        });

        this.barData.set({
          labels: months.map(x => x.month),
          datasets: [{ data: months.map(x => x.cnt) }],
        });
      },
      error: () => {
        this.genreStats.set([]);
        this.monthStats.set([]);
        this.pieData.set({ labels: [], datasets: [{ data: [] }] });
        this.barData.set({ labels: [], datasets: [{ data: [] }] });
      }
    });
  }

  save() {
    const token = this.token();
    if (!token) {
      this.router.navigateByUrl('/auth');
      return;
    }

    this.saveError.set('');
    this.saveOk.set(false);

    const name = this.name().trim();
    const pass = this.password().trim();

    const reqs: Array<Promise<any>> = [];

    if (name) {
      reqs.push(
        this.http.patch('/api/me/profile', { name }, {
          headers: { Authorization: `Bearer ${token}` },
        }).toPromise()
      );
    }

    if (pass) {
      reqs.push(
        this.http.patch('/api/me/password', { password: pass }, {
          headers: { Authorization: `Bearer ${token}` },
        }).toPromise()
      );
    }

    if (reqs.length === 0) {
      this.saveError.set('Нечего сохранять.');
      return;
    }

    this.saving.set(true);

    Promise.all(reqs)
      .then(() => {
        this.saving.set(false);
        this.saveOk.set(true);
        this.password.set('');
        this.loadMe(); 
      })
      .catch((e) => {
        this.saving.set(false);
        this.saveError.set(e?.error?.message || 'Ошибка сохранения');
      });
  }
}
