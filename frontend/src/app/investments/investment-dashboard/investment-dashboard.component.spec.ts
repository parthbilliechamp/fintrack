import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentDashboardComponent } from './investment-dashboard.component';

describe('InvestmentDashboardComponent', () => {
  let component: InvestmentDashboardComponent;
  let fixture: ComponentFixture<InvestmentDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
