import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FichasasignadasComponent } from './fichasasignadas.component';

describe('FichasasignadasComponent', () => {
  let component: FichasasignadasComponent;
  let fixture: ComponentFixture<FichasasignadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FichasasignadasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FichasasignadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
