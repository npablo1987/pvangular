import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieadminComponent } from './pieadmin.component';

describe('PieadminComponent', () => {
  let component: PieadminComponent;
  let fixture: ComponentFixture<PieadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PieadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
