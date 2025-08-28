/// <reference types="cypress" />

/**
 * IT1 – Zorunlu 3 test:
 * 1) inputa metin girer
 * 2) birden fazla malzeme seçer
 * 3) formu gönderir (POST + success route)
 * 
 * Not: Reqres'e gerçek çağrı yapmıyoruz; 401 almamak için
 * cy.intercept ile başarılı bir yanıtı MOCK ediyoruz.
 */

describe('Pizza Order – IT1 (mocked POST)', () => {
    beforeEach(() => {
        // Her test sipariş formunda başlasın
        cy.visit('/order');
    });

    it('İsim inputuna metin yazılabiliyor', () => {
        cy.get('#name')
            .should('exist')
            .type('Ece Karabalık')
            .should('have.value', 'Ece Karabalık');
    });

    it('Birden fazla malzeme seçilebiliyor', () => {
        cy.contains('legend', 'Ek Malzemeler')
            .parent() // fieldset
            .within(() => {
                cy.contains('label', 'Pepperoni').prev('input').check();
                cy.contains('label', 'Domates').prev('input').check();
                cy.contains('label', 'Mısır').prev('input').check();
                cy.contains('label', 'Jalapeno').prev('input').check();
                cy.get('input[type="checkbox"]:checked').should('have.length.gte', 4);
            });
    });

    it('Form gönderiliyor: MOCK POST + success yönlendirme', () => {
        // ---- MOCK: gerçek API yerine sahte başarılı yanıt döndür
        cy.intercept('POST', 'https://reqres.in/api/pizza', (req) => {
            // istersen gönderilen body'i doğrulayabilirsin:
            // expect(req.body.isim).to.exist
            req.reply({
                statusCode: 201,
                body: {
                    id: 'mock-123',
                    createdAt: new Date().toISOString(),
                    ...req.body,                    // geri dönen gövdeye formu da ekledik (opsiyonel)
                    message: 'Sipariş kaydedildi'
                },
            });
        }).as('createPizza');

        // ---- Geçerli formu doldur
        cy.get('#name').type('Ece K.');
        cy.contains('legend', 'Boyut Seç')
            .parent()
            .within(() => {
                cy.contains('label', 'M').prev('input').check(); // M boyutu
            });

        cy.contains('legend', 'Ek Malzemeler')
            .parent()
            .within(() => {
                ['Pepperoni', 'Domates', 'Mısır', 'Jalapeno'].forEach(t =>
                    cy.contains('label', t).prev('input').check()
                );
            });

        // ---- Submit
        cy.get('button[type="submit"]').should('not.be.disabled').click();

        // ---- Yanıt gerçekten döndü mü?
        cy.wait('@createPizza').its('response.body').then((body) => {
            expect(body).to.have.property('id');
            expect(body).to.have.property('createdAt');
            expect(body).to.have.property('message', 'Sipariş kaydedildi');
        });

        // ---- Success sayfasına yönlendirildi mi?
        cy.location('pathname').should('include', '/success');
        cy.contains('TEBRİKLER').should('be.visible');
    });
});