import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionfichaComponent } from './revisionficha.component';

describe('RevisionfichaComponent', () => {
  let component: RevisionfichaComponent;
  let fixture: ComponentFixture<RevisionfichaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionfichaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisionfichaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
