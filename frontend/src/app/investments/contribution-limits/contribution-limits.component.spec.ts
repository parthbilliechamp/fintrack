import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributionLimitsComponent } from './contribution-limits.component';

describe('ContributionLimitsComponent', () => {
  let component: ContributionLimitsComponent;
  let fixture: ComponentFixture<ContributionLimitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributionLimitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContributionLimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
